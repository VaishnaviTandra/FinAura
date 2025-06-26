"use server"
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
const serialiseTransaction=(obj)=>{
    const serialized={...obj};
    if(obj.balance){
        serialized.balance=obj.balance.toNumber();
    }
    if(obj.amount){
        serialized.amount=obj.amount.toNumber();
    }
     return serialized;
}
export async function updateDefaultAccount(accountid){
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
        await prisma.account.updateMany({
                where:{userId:user.id,isDefault:true},
                data:{isDefault:false}
            })
        const account=await prisma.account.update({
            where:{
                id:accountid,
                userId:user.id
            },data:{
                isDefault:true
            }
        })
        revalidatePath('/dashboard');
        return {success:true,data:serialiseTransaction(account)}
    } catch (error) {
        return {success:false,error:error.message}
    }
}
export async function getAccountWithTransaction(accountId){
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
        const account=await prisma.account.findUnique({
            where:{
                id:accountId,
                userId:user.id
            },include:{
                transactions:{
                    orderBy:{date:"desc"}
                },
                _count:{
                    select:{transactions:true}
                }
            }
        })
        if(!account){
            return null;
        }
        return{
            ...serialiseTransaction(account),
            transactions:account.transactions.map(serialiseTransaction)
        }
}
export async function bulkDeleteTransactions(transactionIds){
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
        const transactions=await prisma.transaction.findMany({
            where:{
                id:{in:transactionIds},
                userId:user.id
            }
        })
        const accountBalanceChanges=transactions.reduce((acc,transaction)=>{
            const change=transaction.type==="EXPENSE"?transaction.amount:-transaction.amount
            acc[transaction.accountId]=(acc[transaction.accountId]|0)+change
            return acc;
        },{})
        //delete transactions and update account balance
        await prisma.$transaction(async(tx)=>{
            await tx.transaction.deleteMany({
                where:{
                    id:{in:transactionIds},
                    userId:user.id
                }
            })
            //to update account balance
            //accountbalanceChanges is converted to array by doing Object.entries
            for(const [accountId,balanceChange] of Object.entries(
                accountBalanceChanges
            )){
                await tx.account.update({
                    where:{id:accountId},data:{
                        balance:{
                            increment:balanceChange
                        }
                    }
                })
            }
        })
        revalidatePath("/dashboard")
        revalidatePath("/account/[id]")
        return {success:true}
    } catch (error) {
        return {success:false,error:error.message}
    }
}