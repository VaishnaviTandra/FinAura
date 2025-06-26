"use server"
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId){
    try {
        const {userId}=await auth();
        if(!userId){
            throw new Error("Unauthorized")
        }
        //step2
        //check whether user exists in database or not
        const user=await prisma.user.findUnique({
            where:{clerkUserId:userId},
        })
        if(!user){
            throw new Error("User not found");
        }
        const budget=await prisma.budget.findFirst({
            where:{
                userId:user.id
            }
        })
        const currentDate =new Date()
        const startOfMonth=new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        )
        const endOfMonth=new Date(
            currentDate.getFullYear(),
            currentDate.getMonth()+1,
            0
        )
        //the below code helps in summing up the expense amount for a specific userId,accountId and a given date range
        const expense=await prisma.transaction.aggregate({
            where:{
                userId:user.id,
                type:"EXPENSE",
                date:{
                    gte:startOfMonth,//get=greater than or equal to
                    lte:endOfMonth
                },
                accountId,
            },
            _sum:{
                amount:true,
            }
        })
        return {
            budget:budget?{...budget,amount:budget.amount.toNumber()}:null,
            currentExpenses:expense._sum.amount?expense._sum.amount.toNumber():0
        }
    } catch (error) {
        console.log("Error fetching budget: ",error)
        throw error
        
    }
    
}
export async function updateBudget(amount){
    try {
         const {userId}=await auth();
        if(!userId){
            throw new Error("Unauthorized")
        }
        //step2
        //check whether user exists in database or not
        const user=await prisma.user.findUnique({
            where:{clerkUserId:userId},
        })
        if(!user){
            throw new Error("User not found");
        }
        //upsert is combination of update and insert in prisma
        const budget=await prisma.budget.upsert({
            where:{
                userId:user.id
            },
            update:{
                amount,
            },
            create:{
                userId:user.id,
                amount
            }
        })
        revalidatePath("/dashboard")
        return{
            success:true,
            data:{...budget,amount:budget.amount.toNumber()},
        }
    } catch (error) {
        console.error("Error upddating budget:",error)
        return{success:false,error:error.message}
        
    }
}