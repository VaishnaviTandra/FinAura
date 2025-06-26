"use client"
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow,TableCell } from '@/components/ui/table'
import React, { useMemo, useState } from 'react'
import { format } from 'date-fns';
import { categoryColors } from '@/data/categories';
import { cn } from "@/lib/utils";
// import { Badge } from '@components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, MoreHorizontal, RefreshCcw, RefreshCw, Search, Trash, X } from 'lucide-react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useFetch from '@/hooks/use-fetch';
import { bulkDeleteTransactions } from '@/actions/accounts';
import { toast } from 'sonner';
import { BarLoader } from 'react-spinners';
import { useEffect } from 'react';

const RECURRING_INTERVALS={
  DAILY:"Daily",
  WEEKLY:"Weekly",
  MONTHLY:"Monthly",
  Yearly:"Yearly"
}

const Transactiontable = ({transactions}) => {
  const router=useRouter()

  const [selectedIds,setSelectedIds]=useState([]);
  const [sortConfig,setSortConfig]=useState({
    field:"date",
    direction:"desc",

  });
  const {loading:deleteLoading
    ,fn:deleteFn,
    data:deleted
  }=useFetch(bulkDeleteTransactions)
  const [searchItem,setSearchItem]=useState("");
  const [typeFilter,setTypeFilter]=useState("");
  const [recurringFilter,setRecurringFilter]=useState("");

    const filteredAndSortedTransactions=useMemo(()=>{
      let result=[...transactions];
      //apply search filter
      if(searchItem){
        const searchLower=searchItem.toLowerCase();
        result=result.filter((transaction)=>transaction.description?.toLowerCase().includes(searchLower));
      }
      //apply recurring filter
      if(recurringFilter){
        result=result.filter((transaction)=>{
        if(recurringFilter==="recurring") return transaction.isRecurring
        return !transaction.isRecurring;
        })
      }
      //apply type filter
      if(typeFilter){
        result=result.filter((transaction)=>transaction.type===typeFilter
        )
      }
      //apply sorting
      result.sort((a,b)=>{
        let comparision=0;
        switch(sortConfig.field){
          case "date":
            comparision=new Date(a.date)-new Date(b.date);
            break;
          case "amount":
            comparision=a.amount-b.amount;
            break;
          case "category":
            comparision=a.category.localCompare(b.category);
            break;
          default:
            comparision=0;
            break;
        }
        return sortConfig.direction==="asc"?comparision:-comparision;

      })
      return result;

    },[transactions,searchItem,typeFilter,recurringFilter,sortConfig]);
    const handleSort=(field)=>{
      setSortConfig(current=>({
        field,
        direction:
        current.field==field &&current.direction==="asc"?"desc":"asc"
      }))

    }
    const handleSelect=(id)=>{
      setSelectedIds(current=>current.includes(id)?current.filter(item=>item!=id):[...current,id])
    }
    console.log(selectedIds)
    //to select all transactions
    const handleSelectAll=()=>{
      setSelectedIds(current=>current.length===filteredAndSortedTransactions.length?[]:filteredAndSortedTransactions.map(t=>t.id))

    }
    //to delete multiple transactions
    const handleBulkDelete=async()=>{
      if(!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions`)){
        return;
      }
      deleteFn(selectedIds)

    }
    useEffect(()=>{
      if(deleted&&!deleteLoading){
        toast.error("transactions deleted Succesfully");
      }
    },[deleted,deleteLoading])
    //to clear all the filters
     const handleClearFilters=()=>{
      setSearchItem("");
      setTypeFilter("");
      setRecurringFilter("");
      setSelectedIds("");
    }
  return (
    <div className="space-y-4">
      {deleteLoading&&<BarLoader className="mt-4" width={"100%"} color="#9333ea"/>}
        {/* filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
            <Input className="pl-8" placeholder="Search transactions..." value={searchItem} onChange={(e)=>setSearchItem(e.target.value)}/>
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="All Types" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="INCOME">Income</SelectItem>
    <SelectItem value="EXPENSE">Expense</SelectItem>
  </SelectContent>
</Select>
  <Select value={recurringFilter} onValueChange={(value)=>setRecurringFilter(value)}>
  <SelectTrigger className="w-[140px]">
    <SelectValue placeholder="All Transactions" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="recurring">Recurring Only</SelectItem>
    <SelectItem value="non-recurring">Non recurring Only</SelectItem>
  </SelectContent>
</Select>
{selectedIds.length>0&&<div className="flex items-center gap-2">
  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
    <Trash className="h-4 w-4 mr-2"/>
    Delete Selected ({selectedIds.length})</Button>
  </div>}
  {/* clear that particular filter if that is selected*/}
  {(searchItem||typeFilter||recurringFilter)&&(
    <Button variant="outline" size="sm" onClick={handleClearFilters} title="Clear Filters">
      <X className="h-4 w-4"/>
    </Button>
  )}
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-md border">
        <Table>
  
  <TableHeader>
    <TableRow>
      <TableHead className="w-[50px]">
        <Checkbox onCheckedChange={handleSelectAll} checked={selectedIds.length===filteredAndSortedTransactions.length&&filteredAndSortedTransactions.length>0}/>
        </TableHead>
         <TableHead className="cursor-pointer" onClick={()=>handleSort("date")}>
            <div className="flex items-center"> Date {sortConfig.field==="date"&&(sortConfig.direction==="asc"?<ChevronUp className="ml-1 h-4 w-4"/>:<ChevronDown className='ml-1 h-4 w-4'/>)}</div>
        </TableHead>
         <TableHead>
       Description
        </TableHead>
        <TableHead className="cursor-pointer" onClick={()=>handleSort("category")}>
        <div className="flex items-center">Category {sortConfig.field==="category"&&(sortConfig.direction==="asc"?<ChevronUp className="ml-1 h-4 w-4"/>:<ChevronDown className='ml-1 h-4 w-4'/>)} </div>
        </TableHead>
      <TableHead className="cursor-pointer" onClick={()=>handleSort("amount")}>
       <div className="flex items-center justify-end"> Amount {sortConfig.field==="amount"&&(sortConfig.direction==="asc"?<ChevronUp className="ml-1 h-4 w-4"/>:<ChevronDown className='ml-1 h-4 w-4'/>)}</div>
        </TableHead>
        <TableHead>Recurring</TableHead>
        <TableHead className="w-[50px]"/>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredAndSortedTransactions.length===0?
    <TableRow>
        <TableCell colSpan={7} className="text-center text-muted-foreground">
            No Transactions found
        </TableCell>
    </TableRow>:(
        filteredAndSortedTransactions.map((transaction)=>(
            <TableRow key={transaction.id}>
      <TableCell >
        <Checkbox onCheckedChange={()=>handleSelect(transaction.id)} checked={selectedIds.includes(transaction.id)}/>
        </TableCell>
      <TableCell>{format(new Date(transaction.date),"PP")}</TableCell>
      <TableCell>{transaction.description}</TableCell>
      <TableCell className="capitalize"><span style={{background:categoryColors[transaction.category]}} className="px-2 py-1 rounded text-white text-sm">
        {transaction.category}</span>
        </TableCell>
        <TableCell
                    className={cn(
                      "text-right font-medium",
                      transaction.type === "EXPENSE"
                        ? "text-red-500"
                        : "text-green-500"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}$
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring?(
                      <TooltipProvider>
                         <Tooltip>
  <TooltipTrigger>
    <Badge variant="outline" className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
  <RefreshCw className="h-3 w-3"/>{RECURRING_INTERVALS[transaction.recurringInterval]}</Badge>
  </TooltipTrigger>
  <TooltipContent>
    <div className="text-sm">
      <div className="font-medium">
        Next Date:
      </div>
      <div>{format(new Date(transaction.nextRecurringDate),"PP")}</div>
    </div>
  </TooltipContent>
</Tooltip>
                      </TooltipProvider>
                     ):(<Badge variant="outline" className="gap-1">
  <Clock className="h-3 w-3"/>One-time</Badge>)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="h-8 w-8 p-0">
      <MoreHorizontal className="h-4 w-4"/>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={()=>router.push(`/transaction/create?edit=${transaction.id}`)}>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive" 
    onClick={()=>deleteFn([transaction.id])}
    >
      Delete</DropdownMenuItem>
    
  </DropdownMenuContent>
</DropdownMenu>
                  </TableCell>
      
    </TableRow>
        ))
        
    )}
    
  </TableBody>
</Table>
</div>
    </div>
  )
}

export default Transactiontable