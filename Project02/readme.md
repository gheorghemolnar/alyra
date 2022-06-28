# Running test
```sh
node truffle test test/TP_Voting.test.js
```

# Initialization
## _Allows to verify the followings_
    - initial owner of the contract
    - initial status of the workflow
    - accessibility to ALL users of public variables

# Section: Administrator
## _This section allows to test functionalities for an administrator account_
    - register only one a voter
    - add himself as a voter, when the status is appropriate
    - switch between All the workflow states

# Section Workflow status is 'ProposalsRegistrationStarted'
## _This section allows to test functionalities registered / non-registered voters_
    - check that registered voters (included admin), can add a proposal
    - check that unregistered voters can't add a proposal

# When workflow status is 'VotingSessionStarted'
## _This section allows the verify that registered voters_
    - are able to select an existant proposal Id
    - to vote only 1 proposal
    - should be able to get a voter
    - should be able to get a proposal
    - should not be able to change the workflow status

# Votes tallying
#### _This section allows to verify that the results can only be known, only after the end of voting process_

# Voting process
#### _This section allows to verify that process steps can't be changed arbitrarly_

# When the proposalId 3, has the most votes
#### _This allow to verify that a proposal, which has the most votes count, should be declared as winner_

# When proposalIds: 2 and 3, have equal number of votes
#### _This allow to verify that if 2 proposals, which have the same number of votes, than the first one should be declared as winner_

# Results should look something like this
```
  Contract: TP_Voting
    Newly deployed Contract
      Initialization status
        ✓ should have an owner
        ✓ should have the workflow status equal to RegisteringVoters
        ✓ ALL users should be able to read the winningProposalID
        ✓ ALL users should be able to read the workflow status
      Administrator should
        ✓ be allowed to register a new voter (50184 gas)
        ✓ Not be allowed to register an already registered voter (50184 gas)
        ✓ should be able to add himself as voter when the status is RegisteringVoters (50184 gas)
        ✓ should NOT be able to add himself as voter when the status is NOT RegisteringVoters (47653 gas)
        ✓ should be able to manage the workflow states,  from RegisteringVoters to VotesTallied (174188 gas)
      When workflow status is ProposalsRegistrationStarted
        ✓ Administrator should be able to add a proposal (76776 gas)
        ✓ Registered Voters should be able to add a proposal (136464 gas)
        ✓ NOT Registered Voters should be NOT able to add a proposal
      When workflow status is VotingSessionStarted Registered voters
        ✓ should be able to vote ONLY existant proposals id
        ✓ should be able to vote ONLY an existant proposal id (58101 gas)
        ✓ should be able to vote ONLY ONCE (58101 gas)
        ✓ should be able to get a Voter
        ✓ should be able to get a Proposal by id
        ✓ should NOT be able to change workflow status
      Votes tallying
        ✓ should NOT be possible during voter registration
        ✓ should NOT be possible during proposal registration (303505 gas)
        ✓ should NOT be possible After proposal registration (334080 gas)
        ✓ should NOT be possible during voting session (639650 gas)
        ✓ should BE possible Only after the end of voting session (736604 gas)
      Voting process
        ✓ While RegisteringVoters, switch to other status than ProposalsRegistrationStarted should NOT be possible (47653 gas)
        ✓ While ProposalsRegistrationStarted, switch to other status than ProposalsRegistrationEnded should NOT be possible (78228 gas)
        ✓ While ProposalsRegistrationEnded, switch to other status than VotingSessionStarted should NOT be possible (108758 gas)
        ✓ While VotingSessionStarted, switch to other status than VotingSessionEnded should NOT be possible (139267 gas)
        ✓ While VotingSessionEnded, switch to other status than VotesTallied should NOT be possible (174188 gas)
        ✓ While VotesTallied, switch to other status should NOT be possible (139267 gas)
      When the proposalId 3, has the most votes
        ✓ should be declared as winning proposition
        ✓ should have the description 'Change painting to green'
        ✓ should have the 2 votes
      When proposalIds: 2 and 3, have equal number of votes
        ✓ then proposal 2 should be able declared as winner

·-------------------------------------------|----------------------------|-------------|----------------------------·
|   Solc version: 0.8.14+commit.80d49f37    ·  Optimizer enabled: false  ·  Runs: 200  ·  Block limit: 6718946 gas  │
············································|····························|·············|·····························
|  Methods                                                                                                          │
··············|·····························|··············|·············|·············|··············|··············
|  Contract   ·  Method                     ·  Min         ·  Max        ·  Avg        ·  # calls     ·  eur (avg)  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  addProposal                ·       59676  ·      76776  ·      64517  ·          46  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  addVoter                   ·       50184  ·      50196  ·      50189  ·          81  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  endProposalsRegistering    ·           -  ·          -  ·      30575  ·          17  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  endVotingSession           ·           -  ·          -  ·      30509  ·           6  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  setVote                    ·       58101  ·      78013  ·      64660  ·          13  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  startProposalsRegistering  ·           -  ·          -  ·      47653  ·          24  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  startVotingSession         ·           -  ·          -  ·      30530  ·          18  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  TP_Voting  ·  tallyVotes                 ·       34921  ·      66445  ·      53835  ·          10  ·          -  │
··············|·····························|··············|·············|·············|··············|··············
|  Deployments                              ·                                          ·  % of limit  ·             │
············································|··············|·············|·············|··············|··············
|  SimpleStorage                            ·           -  ·          -  ·     202243  ·         3 %  ·          -  │
············································|··············|·············|·············|··············|··············
|  TP_Student                               ·           -  ·          -  ·    1004840  ·        15 %  ·          -  │
············································|··············|·············|·············|··············|··············
|  TP_Voting                                ·           -  ·          -  ·    2137238  ·      31.8 %  ·          -  │
·-------------------------------------------|--------------|-------------|-------------|--------------|-------------·

  33 passing (39s)
```
