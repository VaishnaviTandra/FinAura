import arcjet, { tokenBucket } from "@arcjet/next"

const aj=arcjet({
    key:process.env.ARCJET_KEY,
    //to track the rate limiting for a particular user
    //we can use their ip address or user id
    characteristics:["userId"],
    rules:[
        //tokenBucket is used for ratelimiting
        tokenBucket({
            mode:"LIVE",
            refillRate:10,
            interval:3600,
            capacity:10,
        })
    ]
})
export default aj;