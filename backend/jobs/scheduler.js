
import corn from "node-cron";
import { dailySalesJob } from "./dailySalesJob.js";
import { cashInOutJob } from "./cashInOutJob.js";


export const scheduler = () => {
    corn.schedule("2 0 * * *", async () => {
        try {
            await Promise.allSettled([
                dailySalesJob(),
                cashInOutJob()
            ])
        } catch (error) {
             console.error("Scheduler failed ❌", error);
        }
    }, {timezone: "Asia/Karachi"})
    
};