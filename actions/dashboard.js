"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
//step 7
//convert balance to number(integer)
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
export async function createAccount(data){
    //check whether user is logged in or not
    try{
        //step 1
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
        //step3
        //convert balance to float before saving
        const balanceFloat=parseFloat(data.balance)
        if(isNaN(balanceFloat)){
            throw new Error("Invalid balannce amount")
        }
        //step4
        //check whether its users first account or not if yes make it as default account
        const existingAccounts=await prisma.account.findMany({
            where:{userId:user.id},
        })
        //step5
        //if account should be default then other account should not be default
        const shouldBeDefault=existingAccounts.length===0?true:data.isDefault;
        if(shouldBeDefault){
            await prisma.account.updateMany({
                where:{userId:user.id,isDefault:true},
                data:{isDefault:false}
            })
        }
        //step6
        //create new account
        const account=await prisma.account.create({
            data:{
                ...data,
                balance:balanceFloat,
                userId:user.id,
                isDefault:shouldBeDefault
            },
        })
        //step 8
        const serializedAccount=serialiseTransaction(account)
        //when account is created dashboard should be updated
        revalidatePath("/dashboard")
        return {success:true,data:serializedAccount}
    }catch(error){
        throw new Error(error.message)
    }
}
//serveraction to get user account
export async function getUserAccounts(){
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
        const accounts=await prisma.account.findMany({
            where:{
                userId:user.id
            },orderBy:{
                createdAt:"desc"
            },include:{
                _count:{
                    select:{
                        transactions:true,
                    }
                }
            }
        })
        const serializedAccount=accounts.map(serialiseTransaction)
        return serializedAccount

}