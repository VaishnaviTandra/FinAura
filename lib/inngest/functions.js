import { sendEmail } from "@/actions/send-emails";
import { inngest } from "./client";
import prisma from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 3. Budget Alerts with Event Batching
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await prisma.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await prisma.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Check if we should send an alert
        if (
          percentageUsed >= 80 && // Default threshold of 80%
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          //send Email
          await sendEmail({
            to:budget.user.email,
            subject:`Budget Alert for ${defaultAccount.name}`,
            react:EmailTemplate({
                username:budget.user.name,
                type:"budget-alert",
                data:{
                    percentageUsed,
                    budgetAmount:parseInt(budgetAmount).toFixed(1),
                    totalExpenses:parseInt(totalExpenses).toFixed(1),
                    accountName:defaultAccount.name
                }
            })
          })
          // Update last alert sent
          await prisma.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

export const generateMonthlyReports=inngest.createFunction(
  {
    id:"generate-monthly-reports",
    name:"Generate Monthly Reports"
  },{
    cron:"0 0 1 * *"
  },async({step})=>{
    //fetcha ll users
    const users=await step.run("fetch-users",async()=>{
      return await prisma.user.findMany({
        include:{accounts:true}
      })
    })
    //generate report for all users
    for(const user of users){
      await step.run(`generate-report-${user.id}`,async()=>{
        const lastmonth=new Date();
        lastmonth.setMonth(lastmonth.getMonth()-1);
        const stats=await getMonthlyStats(user.id,lastmonth);
        const monthName=lastmonth.toLocaleString("default",{
          month:"long"
        })
        const insights=await generateFinancialInsights(stats,monthName);

         await sendEmail({
            to:user.email,
            subject:`Your Monthly Financial Report ${monthName}`,
            react:EmailTemplate({
                username:user.name,
                type:"monthly-report",
                data:{
                  stats,
                  month:monthName,
                  insights
                }
            })
          })
      })
    }
    return {processed:users.length}
  }
)

const getMonthlyStats=async(userId,month)=>{
  const startDate=new Date(month.getFullYear(),month.getMonth(),1);
  const endDate=new Date(month.getFullYear(),month.getMonth()+1,0)
  const transactions=await prisma.transaction.findMany({
    where:{
      userId,
      date:{
        gte:startDate,
        lte:endDate
      }
    }
  })
  return transactions.reduce((stats,t)=>{
    const amount=t.amount.toNumber()
    if(t.type==="EXPENSE"){
      stats.totalExpenses+=amount;
      stats.byCategory[t.category]=(stats.byCategory[t.category]||0)+amount
    }else{
      stats.totalIncome+=amount;
    }
    return stats;
  },{
    totalExpenses:0,
    totalIncome:0,
    byCategory:{},
    transactionCount:transactions.length
  })

}
async function generateFinancialInsights(stats,month){
  const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model=genAI.getGenerativeModel({model:"gemini-1.5-flash"})
   const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;
  try {
      const result = await model.generateContent(prompt);
    const response=await result.response;
    const text=response.text();
    const cleanedText=text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText)
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
    
  }


}