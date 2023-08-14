import {Request, Response} from "express"
import {getRepository} from "typeorm"
import {User} from "../entity/user.entity"
import {client} from "../index"
import {Order} from "../entity/order.entity";

export const Ambassadors = async (req: Request, res: Response) => {
    res.send(await getRepository(User).find({
        is_ambassador: true
    }))
}

export const Rankings = async (req: Request, res: Response) => {
    const ambassadors = await getRepository(User).find({is_ambassador: true})
    const orders = await getRepository(Order).find({relations: ["order_items"]})

    async function getMap() {
        return ambassadors.map(ambassador => {
            const revenue = orders.filter(order => order.complete && order.user_id === ambassador.id).reduce((s, o) => s + o.ambassador_revenue, 0)
            return {
                name: ambassador.name,
                revenue
            }
        })
    }

    const rankings = await getMap()
    const sortedRankings = rankings.sort((a, b) => {
        if (a.revenue > b.revenue) return -1
        if (a.revenue < b.revenue) return 1
        return 0
    })
    res.send(sortedRankings)
}
