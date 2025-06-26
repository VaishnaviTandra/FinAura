"use client"
import React, { useEffect, useState } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Pencil, X } from 'lucide-react'
import useFetch from '@/hooks/use-fetch'
import { updateBudget } from '@/actions/budget'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

const BudgetProgress = ({initialBudget,currentExpenses}) => {
    const [isEditing,setIsEditing]=useState(false)
    const [newBudget,setNewBudget]=useState(
        initialBudget?.amount?.toString()||""
    )
    const percentageUsed=initialBudget
    ?(currentExpenses/initialBudget.amount)*100
    :0;
    const {loading:isLoaing,fn:updateBudgetfn,data:updatedbudget,error}=useFetch(updateBudget)
    const handleUpdateBudget=async()=>{
        const amount=parseFloat(newBudget)
        if(isNaN(amount)||amount<=0){
            toast.error("Please enter a valid amount")
            return ;
        }
        await updateBudgetfn(amount);
    }
    useEffect(()=>{
        if(updatedbudget?.success){
            toast.success("Budget updated succesfully")
        }

    },[updatedbudget])

     useEffect(()=>{
        if(error){
           toast.error(error.message||"failed to update budget")
        }

    },[error])

    const handleCancel=()=>{
        setNewBudget(initialBudget?.amount?.toString()||"");
        setIsEditing(false)
    }
  return (
    <div>
        <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <div className="flex-1">
         <CardTitle>Monthly Budhet (Default Account)</CardTitle>
         <div className="flex items-center gap-2 mt-1">
             {isEditing?<div className="flex items-center gap-2">
            <Input type="number"
            value={newBudget}
            onChange={(e)=>setNewBudget(e.target.value)}
            className="w-32" placeholder="Enter amount" autoFocus/>
            <Button variant="ghost" size="icon" className="h-4 w-4 text-green-500" onClick={handleUpdateBudget} disabled={isLoaing}><Check/></Button>
            <Button variant="ghost" size="icon" className="h-4 w-4 text-red-500" onClick={handleCancel} disabled={isLoaing}><X/></Button>
            </div>:(<>
            <CardDescription>
                    {initialBudget?`$${currentExpenses.toFixed(2)} of $${initialBudget.amount.toFixed(2)} spent`:"No budget set"}
                </CardDescription>
                <Button variant="ghost" size="icon" onClick={()=>setIsEditing(true)} className="h-6 w-6">
                    <Pencil className="h-3 w-3"/>
                </Button>
                </>
                
                
            )}
         </div>
       
    </div>
    
  </CardHeader>
  <CardContent>
    {initialBudget&&<div>
        <Progress className="space-y-2" value={percentageUsed} extraStyles={`${percentageUsed>=90?"bg-red-500":percentageUsed>=75?"bg-yellow-500":"bg-green-500"}`} />
            <p className="text-xs text-muted-foreground text-right">{percentageUsed.toFixed(1)}% used</p>
        </div>}
  </CardContent>
  
</Card>
    </div>
  )
}

export default BudgetProgress