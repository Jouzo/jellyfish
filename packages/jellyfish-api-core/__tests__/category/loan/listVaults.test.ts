import { LoanMasterNodeRegTestContainer } from './loan_container'
import { Testing } from '@defichain/jellyfish-testing'
import BigNumber from 'bignumber.js'

describe('Loan listVaults', () => {
  const container = new LoanMasterNodeRegTestContainer()
  const testing = Testing.create(container)
  let collateralAddress: string
  let oracleId: string

  beforeAll(async () => {
    await testing.container.start()
    await testing.container.waitForWalletCoinbaseMaturity()
    collateralAddress = await testing.generateAddress()
    await testing.token.dfi({ address: collateralAddress, amount: 40000 })

    // loan scheme
    await testing.container.call('createloanscheme', [100, 1, 'default'])
    await testing.generate(1)

    // price oracle
    const addr = await testing.generateAddress()
    const priceFeeds = [
      { token: 'DFI', currency: 'USD' },
      { token: 'TSLA', currency: 'USD' },
      { token: 'AAPL', currency: 'USD' }
    ]
    oracleId = await testing.rpc.oracle.appointOracle(addr, priceFeeds, { weightage: 1 })
    await testing.generate(1)
    const timestamp = Math.floor(new Date().getTime() / 1000)
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '1@DFI', currency: 'USD' }] })
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '2@TSLA', currency: 'USD' }] })
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '2@AAPL', currency: 'USD' }] })
    await testing.generate(1)

    // collateral tokens
    await testing.rpc.loan.setCollateralToken({
      token: 'DFI',
      factor: new BigNumber(1),
      fixedIntervalPriceId: 'DFI/USD'
    })

    // loan tokens
    await testing.rpc.loan.setLoanToken({
      symbol: 'TSLA',
      fixedIntervalPriceId: 'TSLA/USD'
    })
    await testing.generate(1)

    await testing.rpc.loan.setLoanToken({
      symbol: 'AAPL',
      fixedIntervalPriceId: 'AAPL/USD'
    })
    await testing.generate(1)
  })

  afterAll(async () => {
    await testing.container.stop()
  })

  it('should listVaults without any arguments', async () => {
    // Before createVault
    {
      const vaults = await testing.rpc.loan.listVaults()
      expect(vaults).toStrictEqual([])
    }

    // create an empty vault
    const ownerAddress1 = await testing.generateAddress()
    const vaultId1 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress1, loanSchemeId: 'default' })
    await testing.generate(1)

    // create a vault and deposit collateral
    const ownerAddress2 = await testing.generateAddress()
    const vaultId2 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress2, loanSchemeId: 'default' })
    await testing.generate(1)
    await testing.rpc.loan.depositToVault({ vaultId: vaultId2, from: collateralAddress, amount: '10000@DFI' })
    await testing.generate(1)

    // create a vault and deposit collateral and take a loan
    const ownerAddress3 = await testing.generateAddress()
    // another loan scheme
    await testing.container.call('createloanscheme', [110, 1, 'scheme'])
    await testing.generate(1)
    const vaultId3 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress3, loanSchemeId: 'scheme' })
    await testing.generate(1)
    await testing.rpc.loan.depositToVault({ vaultId: vaultId3, from: collateralAddress, amount: '10000@DFI' })
    await testing.generate(1)
    await testing.rpc.loan.takeLoan({ vaultId: vaultId3, amounts: '30@TSLA' })
    await testing.generate(1)

    // create a vault and make it liqudated.
    const ownerAddress4 = await testing.generateAddress()
    const vaultId4 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress4, loanSchemeId: 'default' })
    await testing.generate(1)
    await testing.rpc.loan.depositToVault({ vaultId: vaultId4, from: collateralAddress, amount: '10000@DFI' })
    await testing.generate(1)
    await testing.rpc.loan.takeLoan({ vaultId: vaultId4, amounts: '30@AAPL' })
    await testing.generate(1)
    // make vault enter under liquidation state by a price hike of the loan token
    const timestamp = Math.floor(new Date().getTime() / 1000)
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '1000@AAPL', currency: 'USD' }] })
    await testing.generate(1)

    // List vaults
    // should be only vaultId1, vaultId2, vaultId3 coz isUnderLiquidation filter default value equals to false
    const vaults = await testing.rpc.loan.listVaults()
    expect(vaults).toStrictEqual(expect.arrayContaining([
      {
        vaultId: vaultId1,
        ownerAddress: ownerAddress1,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId2,
        ownerAddress: ownerAddress2,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress3,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ]))
  })
})

describe('Loan listVaults with options and pagination', () => {
  const container = new LoanMasterNodeRegTestContainer()
  const testing = Testing.create(container)
  let collateralAddress: string
  let oracleId: string
  let ownerAddress1: string, ownerAddress2: string, ownerAddress3: string, ownerAddress4: string
  let vaultId1: string, vaultId2: string, vaultId3: string, vaultId4: string

  beforeAll(async () => {
    await testing.container.start()
    await testing.container.waitForWalletCoinbaseMaturity()
    collateralAddress = await testing.generateAddress()
    await testing.token.dfi({ address: collateralAddress, amount: 40000 })

    // loan scheme
    await testing.container.call('createloanscheme', [100, 1, 'default'])
    await testing.generate(1)

    // price oracle
    const addr = await testing.generateAddress()
    const priceFeeds = [
      { token: 'DFI', currency: 'USD' },
      { token: 'TSLA', currency: 'USD' },
      { token: 'AAPL', currency: 'USD' }
    ]
    oracleId = await testing.rpc.oracle.appointOracle(addr, priceFeeds, { weightage: 1 })
    await testing.generate(1)
    const timestamp = Math.floor(new Date().getTime() / 1000)
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '1@DFI', currency: 'USD' }] })
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '2@TSLA', currency: 'USD' }] })
    await testing.rpc.oracle.setOracleData(oracleId, timestamp, { prices: [{ tokenAmount: '2@AAPL', currency: 'USD' }] })
    await testing.generate(1)

    // collateral tokens
    await testing.rpc.loan.setCollateralToken({
      token: 'DFI',
      factor: new BigNumber(1),
      fixedIntervalPriceId: 'DFI/USD'
    })

    // loan tokens
    await testing.rpc.loan.setLoanToken({
      symbol: 'TSLA',
      fixedIntervalPriceId: 'TSLA/USD'
    })
    await testing.generate(1)

    await testing.rpc.loan.setLoanToken({
      symbol: 'AAPL',
      fixedIntervalPriceId: 'AAPL/USD'
    })
    await testing.generate(1)

    // create an empty vault
    ownerAddress1 = await testing.generateAddress()
    vaultId1 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress1, loanSchemeId: 'default' })
    await testing.generate(1)

    // create a vault and deposit collateral
    ownerAddress2 = await testing.generateAddress()
    vaultId2 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress2, loanSchemeId: 'default' })
    await testing.generate(1)
    await testing.rpc.loan.depositToVault({ vaultId: vaultId2, from: collateralAddress, amount: '10000@DFI' })
    await testing.generate(1)

    // create a vault and deposit collateral and take a loan
    ownerAddress3 = ownerAddress1
    // another loan scheme
    await testing.container.call('createloanscheme', [110, 1, 'scheme'])
    await testing.generate(1)
    vaultId3 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress3, loanSchemeId: 'scheme' })
    await testing.generate(1)
    await testing.rpc.loan.depositToVault({ vaultId: vaultId3, from: collateralAddress, amount: '10000@DFI' })
    await testing.generate(1)
    await testing.rpc.loan.takeLoan({ vaultId: vaultId3, amounts: '30@TSLA' })
    await testing.generate(1)

    // create a vault and make it liqudated.
    ownerAddress4 = await testing.generateAddress()
    vaultId4 = await testing.rpc.loan.createVault({ ownerAddress: ownerAddress4, loanSchemeId: 'default' })
    await testing.generate(1)
    await testing.rpc.loan.depositToVault({ vaultId: vaultId4, from: collateralAddress, amount: '10000@DFI' })
    await testing.generate(1)
    await testing.rpc.loan.takeLoan({ vaultId: vaultId4, amounts: '30@AAPL' })
    await testing.generate(1)
    // make vault enter under liquidation state by a price hike of the loan token
    const timestamp2 = Math.floor(new Date().getTime() / 1000)
    await testing.rpc.oracle.setOracleData(oracleId, timestamp2, { prices: [{ tokenAmount: '1000@AAPL', currency: 'USD' }] })
    await testing.generate(12) // Wait for 12 blocks which are equivalent to 2 hours (1 block = 10 minutes) in order to liquidate the vault
  })

  afterAll(async () => {
    await testing.container.stop()
  })

  it('should listVaults with ListVaultOptions.ownerAddress', async () => {
    // List vaults
    const vaults = await testing.rpc.loan.listVaults({}, { ownerAddress: ownerAddress1 })
    expect(vaults).toStrictEqual(expect.arrayContaining([
      {
        vaultId: vaultId1,
        ownerAddress: ownerAddress1,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress1,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ]))
  })

  it('should listVaults with ListVaultOptions.loanSchemeId', async () => {
    // List vaults
    const vaults = await testing.rpc.loan.listVaults({}, { loanSchemeId: 'scheme' })
    expect(vaults).toStrictEqual([
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress3,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ])
  })

  it('should listVaults with ListVaultOptions.isUnderLiquidation', async () => {
    // List vaults
    const nonLiquidatedVaults = await testing.rpc.loan.listVaults({}, { isUnderLiquidation: false })
    expect(nonLiquidatedVaults).toStrictEqual(expect.arrayContaining([
      {
        vaultId: vaultId1,
        ownerAddress: ownerAddress1,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId2,
        ownerAddress: ownerAddress2,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress3,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ]))

    const liquidatedVaults = await testing.rpc.loan.listVaults({}, { isUnderLiquidation: true })
    expect(liquidatedVaults).toStrictEqual([
      {
        vaultId: vaultId4,
        ownerAddress: ownerAddress4,
        loanSchemeId: 'default',
        isUnderLiquidation: true
      }
    ])
  })

  it('should listVaults with pagination', async () => {
    // List vaults
    const vaults = await testing.rpc.loan.listVaults({ limit: 2 })
    expect(Object.keys(vaults).length).toStrictEqual(2)

    // fetch the second page
    const vaultsSecondPage = await testing.rpc.loan.listVaults({ including_start: false, start: vaults[Object.keys(vaults).length - 1].vaultId })
    // should be 1 entries
    expect(Object.keys(vaultsSecondPage).length).toStrictEqual(1)

    // fetch the second page with including_start = true
    const vaultsSecondPageIncludingStart = await testing.rpc.loan.listVaults({ including_start: true, start: vaults[Object.keys(vaults).length - 1].vaultId })
    // should be 2 entries
    expect(Object.keys(vaultsSecondPageIncludingStart).length).toStrictEqual(2)

    //  check if we retrived all 3 entries
    expect(vaults.concat(vaultsSecondPageIncludingStart)).toStrictEqual(expect.arrayContaining([
      {
        vaultId: vaultId1,
        ownerAddress: ownerAddress1,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId2,
        ownerAddress: ownerAddress2,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress3,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ]))
  })

  it('should listVaults with pagination and ownerAddress filter', async () => {
    // List vaults with ownerAddress1
    // note that ownerAddress3 = ownerAddress1
    const vaults = await testing.rpc.loan.listVaults({ limit: 2 }, { ownerAddress: ownerAddress1 })
    expect(Object.keys(vaults).length).toStrictEqual(2)
    expect(vaults).toStrictEqual(expect.arrayContaining([
      {
        vaultId: vaultId1,
        ownerAddress: ownerAddress1,
        loanSchemeId: 'default',
        isUnderLiquidation: false
      },
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress3,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ]))

    // fetch the second page
    const vaultsSecondPage = await testing.rpc.loan.listVaults({ including_start: false, start: vaults[Object.keys(vaults).length - 1].vaultId }, { ownerAddress: ownerAddress1 })
    // should be no more entries
    expect(Object.keys(vaultsSecondPage).length).toStrictEqual(0)
  })

  it('should listVaults with pagination and loanSchemeId filter', async () => {
    // List vaults with loanSchemeId = 'scheme'
    // only vaultId3 has loanSchemeId = 'scheme'
    const vaults = await testing.rpc.loan.listVaults({ limit: 2 }, { loanSchemeId: 'scheme' })
    expect(Object.keys(vaults).length).toStrictEqual(1)
    expect(vaults).toStrictEqual([
      {
        vaultId: vaultId3,
        ownerAddress: ownerAddress3,
        loanSchemeId: 'scheme',
        isUnderLiquidation: false
      }
    ])

    // fetch the second page
    const vaultsSecondPage = await testing.rpc.loan.listVaults({ including_start: false, start: vaults[Object.keys(vaults).length - 1].vaultId }, { loanSchemeId: 'scheme' })
    // should be no more entries
    expect(Object.keys(vaultsSecondPage).length).toStrictEqual(0)
  })

  it('should listVaults with pagination and isUnderLiquidation filter', async () => {
    // List vaults with isUnderLiquidation = false
    // only vaultId1, vaultId2, vaultId3 have isUnderLiquidation = false
    const vaults = await testing.rpc.loan.listVaults({ limit: 2 }, { isUnderLiquidation: false })
    expect(Object.keys(vaults).length).toStrictEqual(2)

    // fetch the second page
    const vaultsSecondPage = await testing.rpc.loan.listVaults({ including_start: false, start: vaults[Object.keys(vaults).length - 1].vaultId }, { isUnderLiquidation: false })
    // should be one more entry
    expect(Object.keys(vaultsSecondPage).length).toStrictEqual(1)
  })
})