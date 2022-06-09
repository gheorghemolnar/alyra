// Crowdsale.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.14;

/**
    2022/06/08 TPs 
    - Savings account
*/

enum TransactionType {
    Deposit,
    Widraw
}
struct Transaction {
    address         sender;
    uint            amount;
    uint            timestamp;
    TransactionType transactionType;
}

contract SavingsAccount {
    mapping(uint => Transaction) transactions;
    uint            once               = 0;
    uint            amount             = 0;
    address         owner;

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    constructor(){
        owner = msg.sender;
    }

    receive() external payable {
        require (msg.value > 0, "Not a valid amount");
        amount += msg.value;

        once += 1;
        Transaction memory newTransaction = Transaction({
            sender:             msg.sender,
            amount:             msg.value,
            timestamp:          block.timestamp,
            transactionType:    TransactionType.Deposit
        });
        transactions[once] = newTransaction;
    }

    function widraw() external payable onlyOwner {
        require(amount - msg.value >= 0, "Not enough funds available.");

        uint minDelay   = 3 * 60;    // Min (it can be days, months etc ...)
        bool delay      = block.timestamp - transactions[1].timestamp > minDelay;

        if(delay) {
            // update solde
            amount = amount - msg.value;
            // send the money
            payable(msg.sender).call{value: amount - msg.value}("");
        }
    }
}