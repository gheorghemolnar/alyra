// Crowdsale.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.14;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

struct Voter {
    bool isRegistered;
    bool hasVoted;
    uint votedProposalId;
}

struct Proposal {
    string description;
    uint voteCount;
}

enum WorkflowStatus {
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied
}

contract Voting is Ownable{
    uint                        nonce = 0;                                          // used to register the Proposol number
    WorkflowStatus       public votingStatus = WorkflowStatus.RegisteringVoters;    // Workflow Status
    uint                 public winningProposalId;                                  // WinnerId (computed after Vote closing)

    mapping (address => Voter)  voterslist;         // Registered voters list
    mapping (uint => Proposal)  proposalslist;      // Registered proposals list

    // Events emited
    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    function voterRegistration(address _voter) public onlyOwner () {
        require(votingStatus == WorkflowStatus.RegisteringVoters, "Voter registration no longer available !");
        require(!voterslist[_voter].isRegistered, "Voter already registrerd !");

        Voter memory newVoter = Voter ({isRegistered: true, hasVoted: false, votedProposalId: 0 });
        voterslist[_voter] = newVoter;
        emit VoterRegistered(_voter);
    }

    function proposalRegistration(string memory _description) public{
        require(votingStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration is not possible now.");
        require(voterslist[msg.sender].isRegistered, "Only registred voters can submit a proposal.");

        // used to determine if there are duplicate of a proposal
        bool duplicateProposition = indexOf(_description) != -1;
        require(!duplicateProposition, "Proposition already registered !");

        nonce++;
        Proposal memory newProposal = Proposal ({ description: _description, voteCount: 0 });
        proposalslist[nonce] = newProposal;
        emit ProposalRegistered(nonce);
    }

    function startProposalRegistration() public onlyOwner {
        require(votingStatus == WorkflowStatus.RegisteringVoters, "Invalid action.");
        WorkflowStatus prevVotingStatus = votingStatus;
        votingStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(prevVotingStatus, votingStatus);
    }

    function endProposalRegistration() public onlyOwner {
        require(votingStatus == WorkflowStatus.ProposalsRegistrationStarted, "Invalid action.");
        WorkflowStatus prevVotingStatus = votingStatus;
        votingStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(prevVotingStatus, votingStatus);
    }

    function startProposalVoting() public onlyOwner {
        require(votingStatus == WorkflowStatus.ProposalsRegistrationEnded, "Invalid action.");
        WorkflowStatus prevVotingStatus = votingStatus;
        votingStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(prevVotingStatus, votingStatus);
    }

    function endProposalVoting() public onlyOwner {
        require(votingStatus == WorkflowStatus.VotingSessionStarted, "Invalid action.");
        WorkflowStatus prevVotingStatus = votingStatus;
        votingStatus = WorkflowStatus.VotingSessionEnded;

        emit WorkflowStatusChange(prevVotingStatus, votingStatus);

        // calculate the winner
        winningProposalId = getWinner();
    }

    function voteProposal(uint _proposalId) public {
        require(votingStatus == WorkflowStatus.VotingSessionStarted, "Voting session has not started yet !");
        require(voterslist[msg.sender].isRegistered, "Available to registered voters only !");
        require(voterslist[msg.sender].hasVoted == false, "You can only vote once !");

        voterslist[msg.sender].hasVoted = true;
        voterslist[msg.sender].votedProposalId = _proposalId;

        // _proposalId = 0 => Empty vote, no voteCount to update
        if(_proposalId > 0){
            proposalslist[_proposalId].voteCount += 1;
        }

        emit Voted(msg.sender, _proposalId);
    }

    // compute the winner
    function getWinner() private view returns(uint) {
        require(votingStatus == WorkflowStatus.VotingSessionEnded, "Voting process has not ended !");

        uint totalVoters    = 0;
        uint winner         = 0;

        for (uint i=1; i<=nonce; i++){
            totalVoters +=1;
            if(proposalslist[i].voteCount > winner) {
                winner = i;
            }
        }
        if(winner == 0){
            return 0;
        }

        uint majority       = (totalVoters / 2) + 1;
        if(winner < majority){
            return 0;
        }

        return winner;
    }

    // used to check for Proposal duplicates
    function indexOf(string memory value) private view returns(int){
        for (uint i = 1; i <= nonce; i++) {
            if (keccak256(abi.encodePacked(proposalslist[i].description)) == keccak256(abi.encodePacked(value))) {
                return int(i);
            }
        }
        return -1;
    }
}