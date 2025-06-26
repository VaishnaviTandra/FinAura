import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { checkBudgetAlerts, generateMonthlyReports } from "@/lib/inngest/functions";
// import { helloWorld } from "@/lib/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    // helloWorld
    checkBudgetAlerts,
    generateMonthlyReports
  ],
});
