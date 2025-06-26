import { Inngest } from "inngest";

// Create a client to send and receive events
//retry function is used such that if request fails then to retry another time
export const inngest = new Inngest({ id: "financeplatform",
    name:" AI Finance Platform",
    retyrFuction:async(attempt)=>({
        delay:Math.pow(2,attempt)*1000,
        maxAttempts:2
    })
 });
