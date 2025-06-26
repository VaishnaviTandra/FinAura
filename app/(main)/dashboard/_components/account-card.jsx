"use client"
import { updateDefaultAccount } from '@/actions/accounts';
import { Card, CardContent,  CardHeader, CardTitle,CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react'
import { toast } from 'sonner';
import useFetch from '@/hooks/use-fetch';
import { useEffect } from 'react';

const AccountCard = ({account}) => {
    const {name,type,balance,id,isDefault}=account;
    const {data:updatedAccount,error,fn:updateDefaultFn,loading:updateAccountLoading}= useFetch(updateDefaultAccount)

    const handleDefaultChange=async(event)=>{
        event.preventDefault();
        if(isDefault){
            toast.warning("You need atleast 1 default account");
            return;
        }
        await updateDefaultFn(id)
    }

    useEffect(()=>{
        if(updatedAccount?.success){
            toast.success("default account updated successfully")
        }

    },[updatedAccount])

     useEffect(()=>{
        if(error){
            toast.error(error.message||"Failed to update the default account")
        }

    },[error])
  return (
    <div>
        <Card className="hover:shadow-md transition-shadow group relative">
            <Link href={`/account/${id}`}>
            
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
   <Switch checked={isDefault} onClick={handleDefaultChange} disabled={updateAccountLoading}/>
   
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
        ${parseFloat(balance).toFixed(2)}
    </div>
    <p className="text-xs text-muted-foreground">{type.charAt(0)+type.slice(1).toLowerCase()} Account</p>
  </CardContent>
  <CardFooter className="flex justify-between text-sm text-muted-foreground">
    <div className="flex items-center">
        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500"/>
        Income
    </div>
     <div className="flex items-center">
        <ArrowDownRight className="mr-1 h-4 w-4 text-green-500"/>
       Expense
    </div>
  </CardFooter>
  </Link>
</Card>
    </div>
  )
}

export default AccountCard