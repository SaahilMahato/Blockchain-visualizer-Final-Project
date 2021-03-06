/**
 * @module Transaction
 */


import BlockChain from "../block_chain/block_chain.js";

import { 
    NormalUser, 
    Miner 
} from "../entities/users.js";


const blockChain = new BlockChain(); // create BlockChain object

// initialize list of users 
const users = {
    "saahil mahato": new NormalUser(blockChain, "Saahil Mahato"),
    "anakin skywalker": new NormalUser(blockChain, "Anakin Skywalker"),
    "yoda": new NormalUser(blockChain, "Yoda"),
    "han solo": new NormalUser(blockChain, "Han Solo"),
    "obi-wan kenobi": new NormalUser(blockChain, "Obi-wan Kenobi"),
    "qui-gon ginn": new NormalUser(blockChain, "Qui-Gon Ginn"),
    "ciri": new NormalUser(blockChain, "Ciri")
};

// initialize lise of miners
const miners = {
    "padme amidala": new Miner(blockChain, "Padme Amidala"),
    "geralt": new Miner(blockChain, "Geralt"),
    "yennefer": new Miner(blockChain, "Yennefer"),
    "vesimir": new Miner(blockChain, "Vesimir")
};


/**
 * Validates transaction.
 * 
 * @param {NormalUser | Miner} from - Sender.
 * @param {NormalUser | Miner} to - Receiver.
 * @param {number} amount - the transaction amnount.
 * 
 * @returns {Array<[boolean, string]>} -  Array that containes [validation status, validation message].
 */
const validateTransaction = (from, to, amount) => {

    // SaahilCoin should be involved
    if (!amount)
        return [false, "Transaction does not involve SaahilCoin."]

    // Can't send to self
    if (from.name === to.name)
        return [false, "Invalid transaction entities."];

    // Can't send more SaahilCoin than available 
    if (from.saahilCoin < amount)
        return [false, "Sender doesn't have enough SaahilCoins."];

    return [true, "Valid transaction. New Block added to chain."];
}


/**
 * Updates local block chain of all entities.
 */
const updateBlockChainOfAllEntities = () => {
    for (const user in users)
        users[user].updateBlockChain(blockChain);
    for (const miner in miners)
        miners[miner].updateBlockChain(blockChain);
}


/**
 * Transfers SaahilCoins.
 * 
 * @param {NormalUser | Miner} from - Sender.
 * @param {NormalUser | Miner} to - Receiver.
 * @param {number} amount - the transaction amnount.
 * @param {number} reward - the mining reward.
 * 
 * @returns {Array<[boolean, string]>} - array that contains [transaction status, message].
 */
const transferMoney = async (from, to, amount, reward) => {

    // create data to be stored in block
    const newData = {
        sender: from.name,
        receiver: to.name,
        amount: amount
    }

    // validate transaction
    const [isValid, message] = validateTransaction(from, to, amount);

    if (isValid) {

        /*
        In order to simulate mining competition, first a array was created,
        then promise objects that containes function to mine by one miner each
        was created. Then it was pushed to the array. 
        */

        const promiseArray = [];

        for (const miner in miners) {
            const promise = new Promise(async (resolve, reject) => {
                const [status, minerObject, block] = await miners[miner].mine(newData, blockChain);
                if (status)
                    resolve([status, minerObject, block]);
                else
                    reject([status, minerObject, block]);
            });
            promiseArray.push(promise);
        }
        
        // Use promise.race with the promise array so the miner that finished mining first returns it's status and created block.
        const [isMined, miner, block] = await Promise.race(promiseArray);

        // if mined update the entities in the network
        if (isMined) {
            blockChain.addBlock(block); // add new block to chain
            updateBlockChainOfAllEntities(); // add new block to chain of all entities
            miner.receiveReward(reward); // give miner reward
            from.sendTransaction(newData); // update sender data
            to.receiveTransaction(newData); // update receiver data
            const minerMessage = message + " Mined by " + miner.name + ".";  // update message with miner name
            return [true, minerMessage];
        }
    }
    return [isValid, message];
}


export { 
    blockChain, 
    users, 
    miners, 
    transferMoney 
};
