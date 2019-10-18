const express = require("express")
const router = express.Router()
const Sequelize = require('sequelize')

const Mail = require('../models/mail')
const Op = Sequelize.Op

router.get('/', async (req, res) => {
    res.render('index')
})

router.post('/', async (req, res) => {
    switch(req.body.dateoraccount) {
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

module.exports = router