import express from "express"
import cors from "cors"
import {createConnection, getRepository} from "typeorm"
import dotenv from 'dotenv'
import cookieParser from "cookie-parser"
import {createClient} from "redis"
import {routes} from "./routes"
import {User} from "./entity/user.entity";
import {Order} from "./entity/order.entity";

dotenv.config()

export const client = createClient({
    url: 'redis://redis:6379'
})

createConnection().then(async () => {

    (async () => client.on('error', (err) => console.log(err)))();

    const app = express()

    app.use(cookieParser())
    app.use(express.json())
    app.use(cors({
        credentials: true,
        origin: ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:5000']
    }))

    routes(app)

    app.listen(8000, () => {
        console.log("Listening to port 8000")
    })

    const ambassadors = await getRepository(User).find({
        is_ambassador: true
    });

    const orderRepository = getRepository(Order)

    for (let i = 0; i < ambassadors.length; i++) {
        const orders = await orderRepository.find({
            where: {
                user_id: ambassadors[i].id,
                complete: true
            },
            relations: ['order_items']
        });

        const score = orders.reduce((s, o) => s + o.ambassador_revenue, 0);

        const value = ambassadors[i].name

        await client.ZADD('rankings', score, value);
    }
})
