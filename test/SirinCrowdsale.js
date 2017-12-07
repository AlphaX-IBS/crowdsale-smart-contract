import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const utils = require('./helpers/Utils');

const BigNumber = web3.BigNumber

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should()

//const SirinCrowdsale = artifacts.require('SirinCrowdsale.sol')
const SirinCrowdsale = artifacts.require('../contracts/SirinCrowdsale.sol')
const RefundVault = artifacts.require('../contracts/crowdsale/RefundVault.sol')
const SirinSmartToken = artifacts.require('SirinSmartToken.sol')

contract('SirinCrowdsale', function([_, investor, owner, wallet, walletFounder, walletOEM, walletBounties, walletReserve]) {

    const value = ether(1)

    before(async function() {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock()
    })
    beforeEach(async function() {
        this.startTime = latestTime() + duration.weeks(1);
        this.endTime = this.startTime + duration.weeks(1)
        this.afterEndTime = this.endTime + duration.seconds(1)

        this.token = await SirinSmartToken.new({from: owner});
        this.refundVault = await RefundVault.new(wallet, this.token.address,{from: owner});

        this.crowdsale = await SirinCrowdsale.new(this.startTime,
            this.endTime,
            wallet,
            walletFounder,
            walletOEM,
            walletBounties,
            walletReserve,
            this.token.address,
            this.refundVault.address,
            {
                from: owner
            })

        await this.token.transferOwnership(this.crowdsale.address, {from: owner});
        await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

        await this.crowdsale.claimTokenOwnership({from: owner})
        await this.crowdsale.claimRefundVaultOwnership({from: owner})

    })

    describe('Rate Mechanism', function() {

        beforeEach(async function() {
            await increaseTimeTo(this.startTime)
        })

        it('Should be on day 1 - 1000 ', async function() {
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 1000);
        });

        it('Should be on day 2 - 950 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(1));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 950);
        });

        it('Should be on day 3 - 900 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(2));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 900);
        });

        it('Should be on day 4 - 855 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(3));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 855);
        });

        it('Should be on day 5 - 810 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(4));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 810);
        });

        it('Should be on day 6 - 770 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(5));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 770);
        });

        it('Should be on day 7 - 730 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(6));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 730);
        });

        it('Should be on day 8 - 690 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(7));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 690);
        });

        it('Should be on day 9 - 650 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(8));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 650);
        });

        it('Should be on day 10 - 615 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(9));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 615);
        });

        it('Should be on day 11 - 580 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(10));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 580);
        });

        it('Should be on day 12 - 550 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(11));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 550);
        });

        it('Should be on day 13 - 525 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(12));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 525);
        });

        it('Should be on day 14 - 500 ', async function() {
            await increaseTimeTo(this.startTime + duration.days(13));
            let rate = await this.crowdsale.getRate.call()
            assert.equal(rate, 500);
        });
    })

    describe('Token destroy', function() {

        it('should not allow destroy before after finalize', async function() {

            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({
                value: value,
                from: investor
            })

            try {
                await this.token.destroy(investor, 20, {from: investor});
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should allow destroy after finalize', async function() {

            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({
                value: value,
                from: investor
            })

            await increaseTimeTo(this.afterEndTime)
            await this.crowdsale.finalize({
                from: owner
            })

            await this.token.destroy(investor, 20, {from: investor});
        })
    })


    describe('Token transfer', function() {

        it('should not allow transfer before after finalize', async function() {

            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({
                value: value,
                from: investor
            })

            try {
                await this.token.transfer(walletOEM, 1, {
                    from: investor
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should allow transfer after finalize', async function() {

            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({
                value: value,
                from: investor
            })

            await increaseTimeTo(this.afterEndTime)
            await this.crowdsale.finalize({
                from: owner
            })

            await this.token.transfer(walletOEM, 1, {
                from: walletBounties
            });
        })
    })


    describe('Finalize allocation', function() {

        beforeEach(async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({
                value: value,
                from: investor
            })

            await increaseTimeTo(this.afterEndTime)
            await this.crowdsale.finalize({
                from: owner
            })

            this.totalSupply = await this.token.totalSupply()
        })

        it('Allocate founder token amount as 10% of the total supply', async function() {
            const expectedFounderTokenAmount = this.totalSupply.mul(0.1);
            let walletFounderBalance = await this.token.balanceOf(walletFounder);

            walletFounderBalance.should.be.bignumber.equal(expectedFounderTokenAmount);
        })

        it('Allocate OEM token amount as 10% of the total supply', async function() {
            const expectedOEMTokenAmount = this.totalSupply.mul(0.1);
            let OEMFounderBalance = await this.token.balanceOf(walletOEM);

            OEMFounderBalance.should.be.bignumber.equal(expectedOEMTokenAmount);
        })

        it('Allocate professional fees and Bounties token amount as 5% of the total supply', async function() {
            const expectedBountiesTokenAmount = this.totalSupply.mul(0.05);
            let walletFounderBalance = await this.token.balanceOf(walletBounties);

            walletFounderBalance.should.be.bignumber.equal(expectedBountiesTokenAmount);
        })

        it('Allocate Reserve token amount as 35% of the total supply', async function() {
            const expectedReserveTokenAmount = this.totalSupply.mul(0.35);
            let walletFounderBalance = await this.token.balanceOf(walletReserve);

            walletFounderBalance.should.be.bignumber.equal(expectedReserveTokenAmount);
        })

        it('should set finalized true value', async function() {
            assert.equal(await this.crowdsale.isFinalized(), true);
        })

        it('should set token owner to crowdsale owner', async function() {

            await this.token.claimOwnership({
                from: owner
            })

            let tokenOwner = await this.token.owner();
            assert.equal(tokenOwner, owner);
        })

    })

    describe('Grant tokens', function() {

        it('should grant by owner', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.addUpdateGrantee(investor, 100, {
                from: owner
            })
            let total = await this.crowdsale.presaleGranteesMap(investor)
            assert(total == 100, "grant has failed");
        })

        it('should not grant by none-owner', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.addUpdateGrantee(investor, 100, {
                    from: investor
                });
                assert(false, "a none owner granted successfully");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not be before crowdsale time', async function() {
            try {
                await increaseTimeTo(this.startTime - duration.days(1))
                await this.crowdsale.addUpdateGrantee(investor, 100, {
                    from: owner
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not be after crowdsale time', async function() {
            try {
                await increaseTimeTo(this.afterEndTime)
                await this.crowdsale.addUpdateGrantee(investor, 100, {
                    from: owner
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not grant to address \'0x0\'', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.addUpdateGrantee('0x0', 100, {
                    from: owner
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not grant value \'0\'', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.addUpdateGrantee(investor, 0, {
                    from: owner
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not grant to more than MAX_GRANTEE', async function() {
            try {
                let max_grantees = await this.crowdsale.MAX_TOKEN_GRANTEES()
                await increaseTimeTo(this.startTime)
                for (let i = 0; i <= max_grantees; i++) {
                    let address = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b750" + i
                    await this.crowdsale.addUpdateGrantee(address, 100, {
                        from: owner
                    });
                }
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should update a grantee', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.addUpdateGrantee(investor, 100, {
                from: owner
            })
            await this.crowdsale.addUpdateGrantee(investor, 50, {
                from: owner
            })
            let total = await this.crowdsale.presaleGranteesMap(investor);
            assert(total == 50, "update has failed");
        })

        it('should remove a grantee by owner', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.addUpdateGrantee(investor, 100, {
                from: owner
            })
            await this.crowdsale.deleteGrantee(investor, {
                from: owner
            });
            let total = await this.crowdsale.presaleGranteesMap(investor);
            assert(total == 0, "failed to delete grantee by owner");

        })

        it('should not remove a grantee by none-owner', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.addUpdateGrantee(investor, 100, {
                    from: owner
                })
                await this.crowdsale.deleteGrantee(investor, {
                    from: investor
                });
                let total = await this.crowdsale.presaleGranteesMap(investor);
                assert(false, "didnt throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not remove address 0x0', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.addUpdateGrantee(investor, 100, {
                    from: owner
                })
                await this.crowdsale.deleteGrantee("0x0", {
                    from: owner
                });
                assert(total == 0, "didnt throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should create remove event', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.addUpdateGrantee(investor, 100, {
                from: owner
            })
            const {
                logs
            } = await this.crowdsale.deleteGrantee(investor, {
                from: owner
            })
            const event = logs.find(e => e.event === "GrantDeleted")
            should.exist(event)
        })

        it('should create an add event', async function() {
            await increaseTimeTo(this.startTime)
            const {
                logs
            } = await this.crowdsale.addUpdateGrantee(investor, 100, {
                from: owner
            });
            const event = logs.find(e => e.event === "GrantAdded")
            should.exist(event)
        })

        it('should create an update event', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.addUpdateGrantee(investor, 100, {
                from: owner
            });
            const {
                logs
            } = await this.crowdsale.addUpdateGrantee(investor, 50, {
                from: owner
            });
            const event = logs.find(e => e.event === "GrantUpdated")
            should.exist(event)
        })

        it('should allocate token as expected', async function() {
            await increaseTimeTo(this.startTime)
            let max_grantees = await this.crowdsale.MAX_TOKEN_GRANTEES()
            for (let i = 0; i < max_grantees; i++) {
                let address = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b750" + i
                await this.crowdsale.addUpdateGrantee(address, 100, {
                    from: owner
                });
            }

            await increaseTimeTo(this.afterEndTime)
            await this.crowdsale.finalize({
                from: owner
            })
            for (let i = 0; i < max_grantees; i++) {
                let grantee = await this.crowdsale.presaleGranteesMapKeys(i);
                let granteeVolume = await this.crowdsale.presaleGranteesMap(grantee);
                let granteeBalance = await this.token.balanceOf(grantee);
                assert.equal(granteeVolume + "", granteeBalance + "", "failed to allocate")
            }
        })
    })

    describe('Total Found', function() {

        it('should start with zero', async function() {
            let total = await this.crowdsale.getTotalFundsRaised();
            assert.equal(total, 0);
        })

        it('should allow only owner account to call setFiatRaisedConvertedToWei', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.setFiatRaisedConvertedToWei(1, {
                from: owner
            });
            let total = await this.crowdsale.getTotalFundsRaised();
            total.should.be.bignumber.equal(1);
        })

        it('should not allow non-owner account to call setFiatRaisedConvertedToWei', async function() {
            try {
                await increaseTimeTo(this.startTime)
                await this.crowdsale.setFiatRaisedConvertedToWei(1, {
                    from: investor
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should allow to call setFiatRaisedConvertedToWei only during crowdsale is active', async function() {
            await increaseTimeTo(this.startTime + duration.days(1))
            await this.crowdsale.setFiatRaisedConvertedToWei(1, {
                from: owner
            });
            let total = await this.crowdsale.getTotalFundsRaised();
            total.should.be.bignumber.equal(1);
        })

        it('should not be at before crowdsale time', async function() {
            try {
                await increaseTimeTo(this.startTime - duration.days(1))
                await this.crowdsale.setFiatRaisedConvertedToWei(1, {
                    from: owner
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should not be at after crowdsale time', async function() {
            try {
                await increaseTimeTo(this.afterEndTime)
                await this.crowdsale.setFiatRaisedConvertedToWei(1, {
                    from: owner
                });
                assert(false, "didn't throw");
            } catch (error) {
                return utils.ensureException(error);
            }
        })

        it('should total amount be equeal to _weiRasied + _noneEthRaised', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({
                value: ether(1),
                from: investor
            })
            await this.crowdsale.setFiatRaisedConvertedToWei(ether(1), {
                from: owner
            });
            let total = await this.crowdsale.getTotalFundsRaised();

            total.should.be.bignumber.equal(ether(2));
        })
    })

    describe('constructor parameters', function() {
        it('should initilaized with a valid walletFounder adderss', async function() {
            try {
                this.token = await SirinSmartToken.new({from: owner});
                this.refundVault = await RefundVault.new(wallet, this.token.address,{from: owner});

                this.crowdsale = await SirinCrowdsale.new(this.startTime,
                    this.endTime,
                    wallet,
                    0x0,
                    walletOEM,
                    walletBounties,
                    walletReserve,
                    this.token.address,
                    this.refundVault.address,
                    {
                        from: owner
                    })

                await this.token.transferOwnership(this.crowdsale.address, {from: owner});
                await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

                await this.crowdsale.claimTokenOwnership({from: owner})
                await this.crowdsale.claimRefundVaultOwnership({from: owner})
            } catch (error) {
                return utils.ensureException(error);
            }

            assert(false, "did not throw with invalid walletFounder address")
        })

        it('should initilaized with a valid walletOEM adderss', async function() {
            try {
                this.crowdsale = await SirinCrowdsale.new(this.startTime,
                    this.endTime,
                    wallet,
                    walletFounder,
                    0x0,
                    walletBounties,
                    walletReserve,
                    this.token.address,
                    this.refundVault.address,
                    {
                        from: owner
                    })

                await this.token.transferOwnership(this.crowdsale.address, {from: owner});
                await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

                await this.crowdsale.claimTokenOwnership({from: owner})
                await this.crowdsale.claimRefundVaultOwnership({from: owner})
            } catch (error) {
                return utils.ensureException(error);
            }

            assert(false, "did not throw with invalid walletOEM address")
        })

        it('should initilaized with a valid walletBounties adderss', async function() {
            try {
                this.crowdsale = await SirinCrowdsale.new(this.startTime,
                    this.endTime,
                    wallet,
                    walletFounder,
                    walletOEM,
                    0x0,
                    walletReserve,
                    this.token.address,
                    this.refundVault.address,
                    {
                        from: owner
                    })

                await this.token.transferOwnership(this.crowdsale.address, {from: owner});
                await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

                await this.crowdsale.claimTokenOwnership({from: owner})
                await this.crowdsale.claimRefundVaultOwnership({from: owner})
            } catch (error) {
                return utils.ensureException(error);
            }
            assert(false, "did not throw with invalid walletBounties address")
        })

        it('should initilaized with a valid walletReserve adderss', async function() {
            try {
                this.crowdsale = await SirinCrowdsale.new(this.startTime,
                    this.endTime,
                    wallet,
                    walletFounder,
                    walletOEM,
                    walletBounties,
                    0x0,
                    this.token.address,
                    this.refundVault.address,
                    {
                        from: owner
                    })

                await this.token.transferOwnership(this.crowdsale.address, {from: owner});
                await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

                await this.crowdsale.claimTokenOwnership({from: owner})
                await this.crowdsale.claimRefundVaultOwnership({from: owner})
            } catch (error) {
                return utils.ensureException(error);
            }

            assert(false, "did not throw with invalid walletReserve address")
        })

        it('should initilaized with a valid token adderss', async function() {
            try {
                this.crowdsale = await SirinCrowdsale.new(this.startTime,
                    this.endTime,
                    wallet,
                    walletFounder,
                    walletOEM,
                    walletBounties,
                    walletReserve,
                    0x0,
                    this.refundVault.address,
                    {
                        from: owner
                    })

                await this.token.transferOwnership(this.crowdsale.address, {from: owner});
                await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

                await this.crowdsale.claimTokenOwnership({from: owner})
                await this.crowdsale.claimRefundVaultOwnership({from: owner})
            } catch (error) {
                return utils.ensureException(error);
            }

            assert(false, "did not throw with invalid walletReserve address")
        })

        it('should initilaized with a valid refundVault adderss', async function() {
            try {
                await this.token.transferOwnership(this.crowdsale.address, {from: owner});

                this.crowdsale = await SirinCrowdsale.new(this.startTime,
                    this.endTime,
                    wallet,
                    walletFounder,
                    walletOEM,
                    walletBounties,
                    walletReserve,
                    this.token.address,
                    0x0,
                    {
                        from: owner
                    })
                await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

                await this.crowdsale.claimTokenOwnership({from: owner})
                await this.crowdsale.claimRefundVaultOwnership({from: owner})
            } catch (error) {
                return utils.ensureException(error);
            }

            assert(false, "did not throw with invalid walletReserve address")
        })

        it('should initilaized with a valid parametrs', async function() {
            this.crowdsale = await SirinCrowdsale.new(this.startTime,
                this.endTime,
                wallet,
                walletFounder,
                walletOEM,
                walletBounties,
                walletReserve,
                this.token.address,
                this.refundVault.address,
                {
                    from: owner
                })

            await this.token.transferOwnership(this.crowdsale.address, {from: owner});
            await this.refundVault.transferOwnership(this.crowdsale.address, {from: owner});

            await this.crowdsale.claimTokenOwnership({from: owner})
            await this.crowdsale.claimRefundVaultOwnership({from: owner})
        })

        it('should create fiat event after update', async function() {
            await increaseTimeTo(this.startTime)
            await this.crowdsale.sendTransaction({value: ether(1),from: investor})
            const {logs} = await this.crowdsale.setFiatRaisedConvertedToWei(ether(1), {from: owner});
            const event = logs.find(e => e.event === "FiatRaisedUpdated")
            should.exist(event)
        })
    })

   describe('Refund from vault', function() {
         it('should refund ether', async function() {

             await increaseTimeTo(this.startTime)
             await this.crowdsale.buyTokensWithGuarantee({
                 value: ether(10),
                 from: investor
             })
             let fundAfterBuy = web3.eth.getBalance(investor);
             await increaseTimeTo(this.afterEndTime)
             await this.crowdsale.finalize({
                from: owner
             })
             await this.crowdsale.refundETH(ether(10), {
                from: investor
             })
             let fundAfterRefund = web3.eth.getBalance(investor);


             assert(fundAfterRefund >= fundAfterBuy, "investor did not received refund");
            })

        it('should not allow to refund ether before finalize', async function() {
           try {
               await increaseTimeTo(this.startTime);
               await this.crowdsale.buyTokensWithGuarantee({
                     value: ether(1),
                     from: investor
               })
               await increaseTimeTo(this.afterEndTime);
               await this.crowdsale.refundETH(ether(1), {
                     from: investor
               })
           }catch (error) {
               return utils.ensureException(error);
           }

           assert(false, "did not throw if user trying to refund before finalize")

         })

        it('should not allow to refund with 0 ether', async function() {
           try{
              await increaseTimeTo(this.startTime)
              await this.crowdsale.buyTokensWithGuarantee({
                  value: ether(10),
                  from: investor
              })
              let fundAfterBuy = web3.eth.getBalance(investor);
              await increaseTimeTo(this.afterEndTime)
              await this.crowdsale.finalize({
                 from: owner
              })
              await this.crowdsale.refundETH(ether(0), {
                 from: investor
             })
             }catch (error) {
                 return utils.ensureException(error);
             }
             assert(false, "did not throw if user trying to refund 0 ether")

          })

          it('should not allow refund ether after REFUND_TIME_FRAME', async function() {
             try {
              await increaseTimeTo(this.startTime);
              await this.crowdsale.buyTokensWithGuarantee({
                    value: ether(1),
                    from: investor
              })
              await increaseTimeTo(this.afterEndTime);
              await this.crowdsale.finalize({
                 from: owner
              })
              await increaseTimeTo(this.afterEndTime + duration.days(await this.crowdsale.REFUND_TIME_FRAME())
              + duration.seconds(1));
              await this.crowdsale.refundETH(ether(1), {
                    from: investor
              })
          }catch (error) {
              return utils.ensureException(error);
          }

          assert(false, "did not throw if user trying to refund before finalize")

         })
       })
       describe('claim from vault', function() {

         it('should claim ether', async function() {
            await increaseTimeTo(this.startTime)

            await this.crowdsale.buyTokensWithGuarantee({
                value: ether(1),
                from: investor
            })
            let tokensToClaim = await this.refundVault.depositedToken(investor);

            await increaseTimeTo(this.afterEndTime)
            await this.crowdsale.finalize({
                from: owner
            })

            await this.crowdsale.claimTokens(tokensToClaim, {
                  from: investor
            });

            let claimedTokensAmount = await this.token.balanceOf(investor);

            assert.equal(tokensToClaim + "", claimedTokensAmount + "", "investor failed to claim tokens" );
             })

         it('should not allow to claim 0 tokens', async function() {
           try{
            await increaseTimeTo(this.startTime)

            await this.crowdsale.buyTokensWithGuarantee({
                value: ether(1),
                from: investor
            })

            await increaseTimeTo(this.afterEndTime)
            await this.crowdsale.finalize({
                from: owner
            })

            await this.crowdsale.claimTokens(0, {
                  from: investor
            })
           }catch (error) {
              return utils.ensureException(error);
           }

           assert(false, "did not throw if user trying to claim 0 tokens")

         })

         it('should not allow to claim ether before finalize', async function() {
           try {
            await increaseTimeTo(this.startTime);
            await this.crowdsale.buyTokensWithGuarantee({
                  value: ether(1),
                  from: investor
            })
            await increaseTimeTo(this.afterEndTime);
            let tokensToClaim = await this.refundVault.depositedToken(investor);
            await this.crowdsale.claimTokens(tokensToClaim, {
                  from: investor
            });
          }catch (error) {
            return utils.ensureException(error);
          }

          assert(false, "did not throw if user trying to refund before finalize")
         })

         it('should allow to claim all', async function() {
           await increaseTimeTo(this.startTime)

           await this.crowdsale.buyTokensWithGuarantee({
               value: ether(1),
               from: investor
           })
           let tokensToClaim = await this.refundVault.depositedToken(investor);

           await increaseTimeTo(this.afterEndTime)
           await this.crowdsale.finalize({
               from: owner
           })

           await this.crowdsale.claimAllTokens({
                 from: investor
           });

           let claimedTokensAmount = await this.token.balanceOf(investor);

           assert.equal(tokensToClaim + "", claimedTokensAmount + "", "investor failed to claim tokens" );
         })

         it('should not allow to claim all ether before finalize', async function() {
           try {
                await increaseTimeTo(this.startTime);
                await this.crowdsale.buyTokensWithGuarantee({
                      value: ether(1),
                      from: investor
                })
                await increaseTimeTo(this.afterEndTime);
                await this.crowdsale.claimAllTokens({
                      from: investor
                });
            }catch (error) {
                return utils.ensureException(error);
            }

            assert(false, "did not throw if user trying to refund before finalize")
        })
     })

     describe('vault ownership', function() {
         it('crowdsale is vaults owner', async function() {
            assert(await this.refundVault.owner() == await this.crowdsale.address, "RefundVault is not crowdsale owner")
         })
     })


})