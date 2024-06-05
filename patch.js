const axios = require('axios');
function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}
class Client{
    constructor(token) {
       axios.defaults.headers =  {
            'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'accept': 'application/json',
                'content-type': 'application/json',
                'sec-ch-ua-mobile': '?0',
                'authorization': 'Bearer ' + token,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'sec-ch-ua-platform': '"macOS"',
                'Sec-Fetch-Site': 'same-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'host': 'api.hamsterkombat.io'
        }
       this.upgrades = {};
       this.autobotConfig = {};
       this.upgradeTotalMoneys = 0;
    }
    async emulateTaps(amount){
        try{
            let taps = await this.getAvailableTaps();
            if(taps[0] > amount){
                let data = JSON.stringify({
                    "count": amount,
                    "availableTaps": taps[0],
                    "timestamp": new Date().getTime()
                });

                let req = (await axios.post('https://api.hamsterkombat.io/clicker/tap/', data)).data
                console.log(`[NETCLOUD.DEV HAMSTER KOMBAT] Taps... Balance: ${req.clickerUser.balanceCoins}`)
                return true;
            }
            else{
                console.log('[NETCLOUD.DEV HAMSTER KOMBAT] Waiting energy')
                return new Promise((resolve)=>{
                    setTimeout(()=>{
                        console.log('[NETCLOUD.DEV HAMSTER KOMBAT] Energy! Tapping...')
                        resolve(true);
                    },amount / taps[1] * 10 * 1000);
                })
            }
        }
        catch (e) {
            void(e);
            console.log("Error with emulating taps")
        }





    }
    async getAvailableTaps(){
        try{
            let req = (await axios.post('https://api.hamsterkombat.io/clicker/sync')).data;
            return [req.clickerUser.availableTaps,req.clickerUser.tapsRecoverPerSec];
        }
        catch (e) {
            void(e);
            console.log("Error with sync user")
        }

    }
    async getUpgrades(){
        try{
            console.log('Error with get upgrades')
        }
        catch (e) {
            return (await axios.post('https://api.hamsterkombat.io/clicker/upgrades-for-buy')).data;
        }

    }
    async buyUpgrades(){
        try{
            let user = await this.getUser();
            let upgrades = await this.getUpgrades();
            let upgradeTotalMoneys = this.upgradeTotalMoneys;
            console.log('[NETCLOUD.DEV HAMSTER KOMBAT] Pumping on amount - ' + upgradeTotalMoneys);
            if(user.clickerUser.balanceCoins < upgradeTotalMoneys){
                console.log('[NETCLOUD.DEV HAMSTER KOMBAT] Cancel pump. Not enought money');
            }
            else{
                shuffle(upgrades.upgradesForBuy)
                let list = [];
                let apiList = upgrades.upgradesForBuy;
                for(let upgrade of apiList){
                    if(upgrade.price < upgradeTotalMoneys && upgrade.isAvailable && !upgrade.isExpired){
                        list.push(upgrade);
                        upgradeTotalMoneys -= upgrade.price
                    }
                }
                for(let upgrade of list){
                    let upgradeRequest = (await axios.post('https://api.hamsterkombat.io/clicker/buy-upgrade',{
                        timestamp : new Date().getTime(),
                        upgradeId : upgrade.id
                    })).data;
                    console.log(`[NETCLOUD.DEV HAMSTER KOMBAT] Pumped ${upgrade.name} on ${upgradeRequest.clickerUser.upgrades[upgrade.id].level} lvl. Balance: ${upgradeRequest.clickerUser.balanceCoins}`)


                }
            }
            console.log(`[NETCLOUD.DEV HAMSTER KOMBAT] Next pump in ${this.autobotConfig.UpgradePeriodicityInMinutes} minutes`)
            setTimeout(()=>{
                this.buyUpgrades()
            },this.autobotConfig.UpgradePeriodicityInMinutes * 60000)
        }
        catch (e) {
            void(e);
            console.log("error with pumping")
        }



    }
    async getUser(){
        try{
            return (await axios.post('https://api.hamsterkombat.io/clicker/sync')).data
        }
        catch (e) {
            void(e);
            console.log('Error with sync user')
        }

    }
    async start(autoBotConfig = {
        taps : 10,
        minimumAmountForUpgrades : 100000,
        UpgradePeriodicityInMinutes : 30,
        key : '',
    }, first = true){
        try{
            if(first){


                first = false;
                this.autobotConfig = autoBotConfig;
                this.upgradeTotalMoneys = autoBotConfig.minimumAmountForUpgrades;
                this.buyUpgrades();
            }
            await this.emulateTaps(autoBotConfig.taps);
            this.start(autoBotConfig, first);
        }
        catch (e) {
            return
        }

    }


}

module.exports = Client;


