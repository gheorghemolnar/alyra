const { BN, expectEvent, expectRevert }    = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TP_Voting     = artifacts.require("./TP_Voting.sol");

const STATUS_RegisteringVoters                  = "RegisteringVoters";
const STATUS_ProposalsRegistrationStarted       = "ProposalsRegistrationStarted";
const STATUS_ProposalsRegistrationEnded         = "ProposalsRegistrationEnded";
const STATUS_VotingSessionStarted               = "VotingSessionStarted";
const STATUS_VotingSessionEnded                 = "VotingSessionEnded";
const STATUS_VotesTallied                       = "VotesTallied";

const CODE_RegisteringVoters                    = 0;
const CODE_ProposalsRegistrationStarted         = 1;
const CODE_ProposalsRegistrationEnded           = 2;
const CODE_VotingSessionStarted                 = 3;
const CODE_VotingSessionEnded                   = 4;
const CODE_VotesTallied                         = 5;

contract("TP_Voting", async(accounts) => {
    context.only("Newly deployed Contract", () => {
        let votingInstance;

        const owner     = accounts[0];
        const voter01   = accounts[1];
        const voter02   = accounts[2];
        const voter03   = accounts[3];
        const voter04   = accounts[4];

        describe("Initialization status", () => {
            before(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
            });

            it(`should have an owner`, async() => {
                const initOwner    = await votingInstance.owner();

                expect(initOwner).to.equal(owner);
            });

            it(`should have the workflow status equal to ${STATUS_RegisteringVoters}`, async() => {
                const initStatus   = await votingInstance.workflowStatus();

                expect(initStatus).to.be.bignumber.equal(new BN(CODE_RegisteringVoters));
            });


            it("ALL users should be able to read the winningProposalID", async()=> {
                const winningProposalID = await votingInstance.winningProposalID();

                expect(winningProposalID).to.be.bignumber.equal(new BN(0));
            });

            it("ALL users should be able to read the workflow status", async()=> {
                const status = await votingInstance.workflowStatus();

                expect(status).to.be.bignumber.equal(new BN(CODE_RegisteringVoters));
            });
        });

        describe("Administrator should", async() => {
            beforeEach(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
            });

            it("be allowed to register a new voter", async() => {
                const addNewVoter = await votingInstance.addVoter(voter01, {from: owner});

                expectEvent(addNewVoter, "VoterRegistered", {voterAddress: voter01});
            });

            it("Not be allowed to register an already registered voter", async() => {
                const addNewVoter1 = await votingInstance.addVoter(voter01, {from: owner});

                expectEvent(addNewVoter1, "VoterRegistered", {voterAddress: voter01});

                await expectRevert(votingInstance.addVoter(voter01, {from: owner}), "Already registered");
            });

            it(`should be able to add himself as voter when the status is ${STATUS_RegisteringVoters}`, async() => {
                const addVoter = await votingInstance.addVoter(owner, {from: owner});
                expectEvent(addVoter, "VoterRegistered", {voterAddress: owner});

                const voterAdmin = await votingInstance.getVoter(owner);

                expect(voterAdmin.isRegistered).to.equal(true);
                expect(voterAdmin.hasVoted).to.equal(false);
                expect(voterAdmin.votedProposalId).to.be.bignumber.equal(new BN(0));
            });

            it(`should NOT be able to add himself as voter when the status is NOT ${STATUS_RegisteringVoters}`, async() => {
                let prevStatusBN = await votingInstance.workflowStatus();
                expect(prevStatusBN).to.be.bignumber.equal(new BN(CODE_RegisteringVoters));

                // change workflow status ProposalRegistering Started
                await votingInstance.startProposalsRegistering({from: owner});
                
                await expectRevert(votingInstance.addVoter(owner, {from: owner}), "Voters registration is not open yet.");
            });


            it(`should be able to manage the workflow states,  from ${STATUS_RegisteringVoters} to ${STATUS_VotesTallied}`, async() => {
                let prevStatusBN;
                let updateWorkflowStatus;

                prevStatusBN = await votingInstance.workflowStatus();
                expect(prevStatusBN).to.be.bignumber.equal(new BN(CODE_RegisteringVoters));

                // ProposalRegistering Started
                updateWorkflowStatus = await votingInstance.startProposalsRegistering({from: owner});
                expectEvent(updateWorkflowStatus, "WorkflowStatusChange", {previousStatus: prevStatusBN, newStatus: new BN(CODE_ProposalsRegistrationStarted)});

                // ProposalRegistering Ended
                prevStatusBN = await votingInstance.workflowStatus();
                updateWorkflowStatus = await votingInstance.endProposalsRegistering({from: owner});
                expectEvent(updateWorkflowStatus, "WorkflowStatusChange", {previousStatus: prevStatusBN, newStatus: new BN(CODE_ProposalsRegistrationEnded)});

                // Voting Started
                prevStatusBN = await votingInstance.workflowStatus();
                updateWorkflowStatus = await votingInstance.startVotingSession({from: owner});
                expectEvent(updateWorkflowStatus, "WorkflowStatusChange", {previousStatus: prevStatusBN, newStatus: new BN(CODE_VotingSessionStarted)});

                // Voting Ended
                prevStatusBN = await votingInstance.workflowStatus();
                updateWorkflowStatus = await votingInstance.endVotingSession({from: owner});
                expectEvent(updateWorkflowStatus, "WorkflowStatusChange", {previousStatus: prevStatusBN, newStatus: new BN(CODE_VotingSessionEnded)});

                // Tally Votes
                prevStatusBN = await votingInstance.workflowStatus();
                updateWorkflowStatus = await votingInstance.tallyVotes({from: owner});
                expectEvent(updateWorkflowStatus, "WorkflowStatusChange", {previousStatus: prevStatusBN, newStatus: new BN(CODE_VotesTallied)});

            });
        });

        describe(`When workflow status is ${STATUS_ProposalsRegistrationStarted}`, async() => {
            beforeEach(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
                await votingInstance.addVoter(owner, {from: owner});
                await votingInstance.addVoter(voter01, {from: owner});
                await votingInstance.startProposalsRegistering({from: owner});
            });

            it("Administrator should be able to add a proposal", async()=> {
                const addProposal = await votingInstance.addProposal("Change painting to red", {from: owner});

                expectEvent(addProposal, "ProposalRegistered", {proposalId: new BN(0)});
            });

            it("Registered Voters should be able to add a proposal", async()=> {
                let addProposal;
                addProposal = await votingInstance.addProposal("Change painting to red", {from: voter01});
                expectEvent(addProposal, "ProposalRegistered", {proposalId: new BN(0)});
                
                addProposal = await votingInstance.addProposal("Change painting to blue", {from: voter01});
                expectEvent(addProposal, "ProposalRegistered", {proposalId: new BN(1)});

            });

            it("NOT Registered Voters should be NOT able to add a proposal", async()=> {
                await expectRevert(votingInstance.addProposal("Change painting to yellow", {from: voter02}), "You're not a voter");
            });
        });

        describe(`When workflow status is ${STATUS_VotingSessionStarted} Registered voters`, async() => {
            beforeEach(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
                // add voters
                await votingInstance.addVoter(owner, {from: owner});
                await votingInstance.addVoter(voter01, {from: owner});
                await votingInstance.addVoter(voter02, {from: owner});
                await votingInstance.addVoter(voter03, {from: owner});

                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to red", {from: voter03});

                await votingInstance.endProposalsRegistering({from: owner});

                // start voting session
                await votingInstance.startVotingSession({from: owner});
            });

            it("should be able to vote ONLY existant proposals id", async() => {
                await expectRevert(votingInstance.setVote(10, {from: voter01}), "Proposal not found");
            });
            
            it("should be able to vote ONLY an existant proposal id", async() => {
                const setVote = await votingInstance.setVote(0, {from: voter02});
                await expectEvent(setVote, "Voted", {voter: voter02, proposalId: new BN(0)});
            });
            
            it("should be able to vote ONLY ONCE", async() => {
                const setVote = await votingInstance.setVote(0, {from: voter03});
                expectEvent(setVote, "Voted", {voter: voter03, proposalId: new BN(0)});
                await expectRevert(votingInstance.setVote(1, {from: voter03}), "You have already voted");
            });

            it("should be able to get a Voter", async() => {
                const voter = await votingInstance.getVoter(voter02, {from: voter01});
                expect(voter.isRegistered).to.equal(true);
            });

            it("should be able to get a Proposal by id ", async() => {
                const proposal = await votingInstance.getOneProposal(2, {from: voter03});
                expect(proposal.description).to.equal("Change painting to pink");
            });

            it("should NOT be able to change workflow status", async() => {
                await expectRevert(votingInstance.endVotingSession( {from: voter01}), "caller is not the owner");
            });
        });

        describe("Votes tallying", async() => {
            beforeEach(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
                // add voters
                await votingInstance.addVoter(owner, {from: owner});
                await votingInstance.addVoter(voter01, {from: owner});
                await votingInstance.addVoter(voter02, {from: owner});
                await votingInstance.addVoter(voter03, {from: owner});
            });

            it("should NOT be possible during voter registration", async() => {
                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
            });

            it("should NOT be possible during proposal registration", async() => {
                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to green", {from: voter03});

                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
            });

            it("should NOT be possible After proposal registration", async() => {
                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to green", {from: voter03});

                await votingInstance.endProposalsRegistering({from: owner});

                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
            });

            it("should NOT be possible during voting session", async() => {
                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to green", {from: voter03});

                await votingInstance.endProposalsRegistering({from: owner});

                await votingInstance.startVotingSession({from: owner});

                await votingInstance.setVote(2, {from: owner});
                await votingInstance.setVote(3, {from: voter01});
                await votingInstance.setVote(3, {from: voter02});
                await votingInstance.setVote(0, {from: voter03});

                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
            });

            it("should BE possible Only after the end of voting session", async() => {
                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to green", {from: voter03});

                await votingInstance.endProposalsRegistering({from: owner});

                await votingInstance.startVotingSession({from: owner});

                await votingInstance.setVote(2, {from: owner});
                await votingInstance.setVote(3, {from: voter01});
                await votingInstance.setVote(3, {from: voter02});
                await votingInstance.setVote(0, {from: voter03});

                await votingInstance.endVotingSession({from: owner});

                const updateStatus = await votingInstance.tallyVotes({from: owner});
                expectEvent(updateStatus, "WorkflowStatusChange", {previousStatus: new BN(CODE_VotingSessionEnded), newStatus: new BN(CODE_VotesTallied)});
            });
        });

        describe("Voting process", async() => {
            beforeEach(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
                // add voters
                await votingInstance.addVoter(owner, {from: owner});
                await votingInstance.addVoter(voter01, {from: owner});
                await votingInstance.addVoter(voter02, {from: owner});
                await votingInstance.addVoter(voter03, {from: owner});
            });

            it(`While ${STATUS_RegisteringVoters}, switch to other status than ${STATUS_ProposalsRegistrationStarted} should NOT be possible`, async() => {
                await expectRevert(votingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
                await expectRevert(votingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
                await expectRevert(votingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");

                const updateStatus = await votingInstance.startProposalsRegistering({from: owner});
                expectEvent(updateStatus, "WorkflowStatusChange", {previousStatus: new BN(CODE_RegisteringVoters), newStatus: new BN(CODE_ProposalsRegistrationStarted)});
            });

            it(`While ${STATUS_ProposalsRegistrationStarted}, switch to other status than ${STATUS_ProposalsRegistrationEnded} should NOT be possible`, async() => {
                let updateStatus = await votingInstance.startProposalsRegistering({from: owner});

                await expectRevert(votingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
                await expectRevert(votingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");

                updateStatus = await votingInstance.endProposalsRegistering({from: owner});
                expectEvent(updateStatus, "WorkflowStatusChange", {previousStatus: new BN(CODE_ProposalsRegistrationStarted), newStatus: new BN(CODE_ProposalsRegistrationEnded)});
            });

            it(`While ${STATUS_ProposalsRegistrationEnded}, switch to other status than ${STATUS_VotingSessionStarted} should NOT be possible`, async() => {
                let updateStatus;
                updateStatus = await votingInstance.startProposalsRegistering({from: owner});
                updateStatus = await votingInstance.endProposalsRegistering({from: owner});

                await expectRevert(votingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
                await expectRevert(votingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");

                await expectRevert(votingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");

                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");

                updateStatus = await votingInstance.startVotingSession({from: owner});
                expectEvent(updateStatus, "WorkflowStatusChange", {previousStatus: new BN(CODE_ProposalsRegistrationEnded), newStatus: new BN(CODE_VotingSessionStarted)});
            });

            it(`While ${STATUS_VotingSessionStarted}, switch to other status than ${STATUS_VotingSessionEnded} should NOT be possible`, async() => {
                let updateStatus;
                updateStatus = await votingInstance.startProposalsRegistering({from: owner});
                updateStatus = await votingInstance.endProposalsRegistering({from: owner});
                updateStatus = await votingInstance.startVotingSession({from: owner});

                await expectRevert(votingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
                await expectRevert(votingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
                await expectRevert(votingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");

                updateStatus = await votingInstance.endVotingSession({from: owner});
                expectEvent(updateStatus, "WorkflowStatusChange", {previousStatus: new BN(CODE_VotingSessionStarted), newStatus: new BN(CODE_VotingSessionEnded)});
            });

            it(`While ${STATUS_VotingSessionEnded}, switch to other status than ${STATUS_VotesTallied} should NOT be possible`, async() => {
                let updateStatus;
                updateStatus = await votingInstance.startProposalsRegistering({from: owner});
                updateStatus = await votingInstance.endProposalsRegistering({from: owner});
                updateStatus = await votingInstance.startVotingSession({from: owner});
                updateStatus = await votingInstance.endVotingSession({from: owner});

                await expectRevert(votingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
                await expectRevert(votingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
                await expectRevert(votingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
                await expectRevert(votingInstance.endVotingSession({from: owner}), "Voting session havent started yet");

                updateStatus = await votingInstance.tallyVotes({from: owner});
                expectEvent(updateStatus, "WorkflowStatusChange", {previousStatus: new BN(CODE_VotingSessionEnded), newStatus: new BN(CODE_VotesTallied)});
            });

            it(`While ${STATUS_VotesTallied}, switch to other status should NOT be possible`, async() => {
                let updateStatus;
                updateStatus = await votingInstance.startProposalsRegistering({from: owner});
                updateStatus = await votingInstance.endProposalsRegistering({from: owner});
                updateStatus = await votingInstance.startVotingSession({from: owner});
                updateStatus = await votingInstance.endVotingSession({from: owner});

                await expectRevert(votingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
                await expectRevert(votingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
                await expectRevert(votingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
                await expectRevert(votingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
            });

        });

        describe(`When the proposalId 3, has the most votes`, async() => {
            before(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
                // add voters
                await votingInstance.addVoter(owner, {from: owner});
                await votingInstance.addVoter(voter01, {from: owner});
                await votingInstance.addVoter(voter02, {from: owner});
                await votingInstance.addVoter(voter03, {from: owner});

                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to green", {from: voter03});

                await votingInstance.endProposalsRegistering({from: owner});

                // start voting session
                await votingInstance.startVotingSession({from: owner});

                await votingInstance.setVote(2, {from: owner});
                await votingInstance.setVote(3, {from: voter01});
                await votingInstance.setVote(3, {from: voter02});
                await votingInstance.setVote(0, {from: voter03});

                // end votinh session
                await votingInstance.endVotingSession({from: owner});

                // tally votes
                await votingInstance.tallyVotes({from: owner});
            });
            
            it("should be declared as winning proposition", async() => {
                const winningProposalId = await votingInstance.winningProposalID();
                expect(winningProposalId).to.be.bignumber.equal(new BN(3));
            });

            it("should have the description 'Change painting to green'", async() => {
                const proposal = await votingInstance.getOneProposal(3, {from: owner});
                expect(proposal.description).to.equal("Change painting to green");
            });
            it("should have the 2 votes", async() => {
                const proposal = await votingInstance.getOneProposal(3, {from: owner});
                expect(proposal.voteCount).to.be.bignumber.equal(new BN(2));
            });

        });

        describe(`When proposalIds: 2 and 3, have equal number of votes`, async() => {
            before(async()=> {
                votingInstance = await TP_Voting.new({from: owner});
                // add voters
                await votingInstance.addVoter(owner, {from: owner});
                await votingInstance.addVoter(voter01, {from: owner});
                await votingInstance.addVoter(voter02, {from: owner});
                await votingInstance.addVoter(voter03, {from: owner});

                // register proposals
                await votingInstance.startProposalsRegistering({from: owner});
                await votingInstance.addProposal("Change painting to red", {from: owner});
                await votingInstance.addProposal("Change painting to blue", {from: voter01});
                await votingInstance.addProposal("Change painting to pink", {from: voter02});
                await votingInstance.addProposal("Change painting to green", {from: voter03});

                await votingInstance.endProposalsRegistering({from: owner});

                // start voting session
                await votingInstance.startVotingSession({from: owner});

                await votingInstance.setVote(2, {from: owner});
                await votingInstance.setVote(3, {from: voter01});
                await votingInstance.setVote(3, {from: voter02});
                await votingInstance.setVote(2, {from: voter03});

                // end votinh session
                await votingInstance.endVotingSession({from: owner});

                // tally votes
                await votingInstance.tallyVotes({from: owner});
            });
            
            it("then proposal 2 should be able declared as winner", async() => {
                const winningProposalId = await votingInstance.winningProposalID();
                expect(winningProposalId).to.be.bignumber.equal(new BN(2));
            });

        });
    });
});
