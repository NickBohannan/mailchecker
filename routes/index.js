const express = require("express")
const router = express.Router()
const Sequelize = require('sequelize')
const moment = require('moment')
const fs = require('fs')

const Mail = require('../models/mail')
const Order = require('../models/order')

const Op = Sequelize.Op

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/mailchecker', async (req, res) => {
    try {
        let preFilteredResults = await Mail.findAll({
            where: {
                sTime: {
                    [Op.startsWith]: moment().format('YYYY/MM/DD')
                }
            }
        })
        let accountArray = []
        let total = 0
        for (let i = 0; i < preFilteredResults.length; i++) {
            if (!accountArray.find((e) => { return e.Account == preFilteredResults[i].Account })) {
                accountArray.push({
                    Account: preFilteredResults[i].Account,
                    Counter: 1
                })
            } else {
                for (let k = 0; k < accountArray.length; k++) {
                    if (accountArray[k].Account == preFilteredResults[i].Account) {
                        accountArray[k].Counter = accountArray[k].Counter + 1
                        break
                    }
                }
            }
        }
        // let finalArray = accountArray.filter(obj => obj.Counter > 1)
        let finalArray = accountArray.filter(e => e.Counter > 1)
        finalArray.forEach(e => e.Counter--)
        finalArray.sort((a,b) => { return b.Counter - a.Counter })
        finalArray.forEach((e) => {
            if (e.Account.includes('0')) {
                total += e.Counter
            }
        })
        res.render('results', {
            finalArray: finalArray,
            total: total
        })
    } catch(err) {
        console.error(err)
    }
})

router.post('/', async (req, res) => {
    switch(req.body.dateoraccount) {
        case 'multiples':
            try {
                let preFilteredResults = await Mail.findAll({
                    where: {
                        sTime: {
                            [Op.startsWith]: moment().format('YYYY/MM/DD')
                        }
                    }
                })
                let accountArray = []
                for (let i = 0; i < preFilteredResults.length; i++) {
                    if (!accountArray.find((e) => { return e.Account == preFilteredResults[i].Account })) {
                        accountArray.push({
                            Account: preFilteredResults[i].Account,
                            Counter: 1
                        })
                    } else {
                        for (let k = 0; k < accountArray.length; k++) {
                            if (accountArray[k].Account == preFilteredResults[i].Account) {
                                accountArray[k].Counter = accountArray[k].Counter + 1
                                break
                            }
                        }
                    }
                }
                // let finalArray = accountArray.filter(obj => obj.Counter > 1)
                let finalArray = accountArray.filter(e => e.Counter > 1)
                res.send(finalArray)
            } catch(err) {
                console.error(err)
            }
            break;
        case 'account':
            try {
                let results = await Mail.findAll({
                    where: {
                        Account: req.body.accountnumber
                    },
                    order: [['sTime', 'DESC']]
                })
                res.render('results', {
                    results: results
                })
            } catch(err) {
                console.error(err)
            }
            break;
        case 'date':
            try {
                let results = await Mail.findAll({
                    where: {
                        sTime: {
                            [Op.gt]: req.body.startingdate,
                            [Op.lt]: req.body.endingdate
                        }
                    }
                })
                res.render('results', {
                    results: results
                })
            } catch(err) {
                console.error(err)
            }
            break;
        case 'both': 
            try {
                let results = await Mail.findAll({
                    where: {
                        sTime: {
                            [Op.gt]: req.body.startingdate,
                            [Op.lt]: req.body.endingdate
                        },
                        Account: req.body.accountnumber
                    }
                })
                res.render('results', {
                    results: results
                })
            } catch(err) {
                console.error(err)
            }
            break;
    }
})

router.get('/backscan', (req, res) => {
    res.render('backscan')
})

router.post('/backscan', async (req, res) => {

    let missedBackscans = []
    let fileArray = []

    try {

        let fourMonthOrders = await Order.findAll({
            where: {
                actual_ship_date: {
                    [Op.gt]: req.body.startingdate,
                    [Op.lt]: req.body.endingdate
                },
                patient_name: {
                    [Op.notLike]: '%test%',
                    [Op.notLike]: '%Test%'
                },
                customer_code: {
                    [Op.not]: '1111111111'
                },
                hold_code: 0,
                cancel_who: ""
            }
        })
        
        fs.readdir('//fp02/Docuware/PaperPort/2019/10 October', (err, files) => {
            files.forEach(e => {
                let orderSubstring = e.substring(1, 12)
                fileArray.push(orderSubstring)
            })
            for (let i=0;i<fourMonthOrders.length;i++) {
                if (!fileArray.includes(fourMonthOrders[i].order_no_ext)) {
                    missedBackscans.push([
                        fourMonthOrders[i].order_no_ext,
                        fourMonthOrders[i].ord_type,
                        fourMonthOrders[i].customer_name, 
                        fourMonthOrders[i].product_name,
                        fourMonthOrders[i].actual_ship_date,
                        fourMonthOrders[i].cancel_who
                    ])
                }
            }
            console.log(fileArray.length)
            console.log(missedBackscans.length)
            res.send(missedBackscans)
        })

    } catch (err) {
        console.error(err)
    }
}) 

router.get('/label', (req, res) => {
    res.render('label')
})

module.exports = router