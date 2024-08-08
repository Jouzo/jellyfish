import BigNumber from 'bignumber.js'
import { SmartBuffer } from 'smart-buffer'
import { OP_DEFI_TX } from '../../../../src/script/dftx'
import { OP_CODES } from '../../../../src'
import { toBuffer, toOPCodes } from '../../../../src/script/_buffer'
import { TransferDomain, CTransferDomain } from '../../../../src/script/dftx/dftx_account'

it('should bi-directional buffer-object-buffer', () => {
  const fixtures = [
    /**
     * [{
     *  src: {
     *    address: 'mwsZw8nF7pKxWH8eoKL9tPxTpaFkz7QeLU',
     *    amount '1.23456789@DFI',
     *    domain: TransferDomainType.DVM
     *  },
     *  dst: {
     *    address: '0x9b8a4af42140d8a4c153a822f02571a1dd037e89',
     *    amount: '1.23456789@DFI',
     *    domain: TransferDomainType.EVM
     *  }
     * }]
     */
    '6a4d9e014466547838011976a914b36814fd26190b321aa985809293a41273cfe15e88ac0015cd5b07000000000200166014897e03dda17125f022a853c1a4d84021f44a8a9b0015cd5b070000000003fd4f01f9014c808502540be400830186a094000000000000000000000000000000000000030280b8e4d57b28260000000000000000000000000a06de8abc3f15359ec0dfe32394c8b8f09e828f0000000000000000000000009b8a4af42140d8a4c153a822f02571a1dd037e89000000000000000000000000000000000000000000000000112210f4768db400000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000226d77735a77386e4637704b78574838656f4b4c39745078547061466b7a3751654c550000000000000000000000000000000000000000000000000000000000008208fda0575c288a449935a857409f96b0e655f917d383f02ae7a71ec7b9433534ac22eda05e7063b07c9816334e36251ccdd3eca8d360b3adb12078fe605ee30d32e15a12',
    /**
     * [{
     *  src: {
     *    address: '0x9b8a4af42140d8a4c153a822f02571a1dd037e89',
     *    amount: '1.23456789@DFI',
     *    domain: TransferDomainType.EVM
     *  }
     *  dst: {
     *    address: 'mwsZw8nF7pKxWH8eoKL9tPxTpaFkz7QeLU',
     *    amount '1.23456789@DFI',
     *    domain: TransferDomainType.DVM
     *  },
     * }]
     */
    '6a4d9e01446654783801166014897e03dda17125f022a853c1a4d84021f44a8a9b0015cd5b070000000003fd4f01f9014c808502540be400830186a094df0000000000000000000000000000000000000180b8e4d57b28260000000000000000000000009b8a4af42140d8a4c153a822f02571a1dd037e89000000000000000000000000df00000000000000000000000000000000000001000000000000000000000000000000000000000000000000112210f4768db400000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000226d77735a77386e4637704b78574838656f4b4c39745078547061466b7a3751654c550000000000000000000000000000000000000000000000000000000000008208fda0bbde8a695f9a1851de608627014eab97d4e649a0782bac21bcff78d93122d3e1a056dc98b61aff3d7bf0fb99a542373f2797dffd6e8f06e53377b3cfe7305f63241976a914b36814fd26190b321aa985809293a41273cfe15e88ac0015cd5b07000000000200'
  ]

  fixtures.forEach(hex => {
    const stack = toOPCodes(
      SmartBuffer.fromBuffer(Buffer.from(hex, 'hex'))
    )
    const buffer = toBuffer(stack)
    expect(buffer.toString('hex')).toStrictEqual(hex)
    expect((stack[1] as OP_DEFI_TX).tx.type).toStrictEqual(0x38)
  })
})

// 6a4d9e014466547838
// 011976a914b36814fd26190b321aa985809293a41273cfe15e88ac0015cd5b07000000000200166014897e03dda17125f022a853c1a4d84021f44a8a9b0015cd5b070000000003fd4f01f9014c808502540be400830186a094000000000000000000000000000000000000030280b8e4d57b28260000000000000000000000000a06de8abc3f15359ec0dfe32394c8b8f09e828f0000000000000000000000009b8a4af42140d8a4c153a822f02571a1dd037e89000000000000000000000000000000000000000000000000112210f4768db400000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000226d77735a77386e4637704b78574838656f4b4c39745078547061466b7a3751654c550000000000000000000000000000000000000000000000000000000000008208fda0575c288a449935a857409f96b0e655f917d383f02ae7a71ec7b9433534ac22eda05e7063b07c9816334e36251ccdd3eca8d360b3adb12078fe605ee30d32e15a12
const header = '6a4d9e014466547838' // OP_RETURN(0x6a) (length 77 = 0x4d) CDfTx.SIGNATURE(0x44665478) CTransferDomain.OP_CODE(0x38)
// 01 19 76
// TransferDomain[0].OP_H160 (0xa9)
// length 20 (0x14)
// TransferDomain[0].OP_PUSHDATA_HEX_LE (b36814fd26190b321aa985809293a41273cfe15e)
// 00 ac
// TransferDomain[0].amount.token (0x00)
// TransferDomain[0].amount.amount [LE] (0x15cd5b0700000000) -> 0x00000000075bcd15 -> 123456789
// TransferDomain[0].domain (0x02)
// TransferDomain[0].data (0x00)
// 16
// TransferDomain[1].OP_CODES.OP_16 (0x60)
// length 20 (0x14)
// TransferDomain[1].OP_PUSHDATA_HEX_BE (0x897e03dda17125f022a853c1a4d84021f44a8a9b) -> 0x9b8a4af42140d8a4c153a822f02571a1dd037e89
// TransferDomain[0].amount.token (0x00)
// TransferDomain[0].amount.amount [LE] (0x15cd5b0700000000) -> 0x00000000075bcd15 -> 123456789
// TransferDomain[0].domain (0x03)
// fd 4f 01
// TransferDomain[0].data (0xf9014c808502540be400830186a094000000000000000000000000000000000000030280b8e4d57b28260000000000000000000000000a06de8abc3f15359ec0dfe32394c8b8f09e828f0000000000000000000000009b8a4af42140d8a4c153a822f02571a1dd037e89000000000000000000000000000000000000000000000000112210f4768db400000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000226d77735a77386e4637704b78574838656f4b4c39745078547061466b7a3751654c550000000000000000000000000000000000000000000000000000000000008208fda0575c288a449935a857409f96b0e655f917d383f02ae7a71ec7b9433534ac22eda05e7063b07c9816334e36251ccdd3eca8d360b3adb12078fe605ee30d32e15a12)
const data = '011976a914b36814fd26190b321aa985809293a41273cfe15e88ac0015cd5b07000000000200166014897e03dda17125f022a853c1a4d84021f44a8a9b0015cd5b070000000003fd4f01f9014c808502540be400830186a094000000000000000000000000000000000000030280b8e4d57b28260000000000000000000000000a06de8abc3f15359ec0dfe32394c8b8f09e828f0000000000000000000000009b8a4af42140d8a4c153a822f02571a1dd037e89000000000000000000000000000000000000000000000000112210f4768db400000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000226d77735a77386e4637704b78574838656f4b4c39745078547061466b7a3751654c550000000000000000000000000000000000000000000000000000000000008208fda0575c288a449935a857409f96b0e655f917d383f02ae7a71ec7b9433534ac22eda05e7063b07c9816334e36251ccdd3eca8d360b3adb12078fe605ee30d32e15a12'
const transferDomain: TransferDomain = {
  items: [{
    src: {
      address: {
        stack: [
          OP_CODES.OP_DUP,
          OP_CODES.OP_HASH160,
          OP_CODES.OP_PUSHDATA_HEX_LE('b36814fd26190b321aa985809293a41273cfe15e'),
          OP_CODES.OP_EQUALVERIFY,
          OP_CODES.OP_CHECKSIG
        ]
      },
      amount: { token: 0, amount: new BigNumber(1.23456789) },
      domain: 2, // TransferDomainType.DVM
      data: new Uint8Array([])
    },
    dst: {
      address: {
        stack: [
          OP_CODES.OP_16,
          OP_CODES.OP_PUSHDATA_HEX_BE('9b8a4af42140d8a4c153a822f02571a1dd037e89')
        ]
      },
      amount: { token: 0, amount: new BigNumber(1.23456789) },
      domain: 3, // TransferDomainType.EVM
      data: new Uint8Array(Buffer.from('f9014c808502540be400830186a094000000000000000000000000000000000000030280b8e4d57b28260000000000000000000000000a06de8abc3f15359ec0dfe32394c8b8f09e828f0000000000000000000000009b8a4af42140d8a4c153a822f02571a1dd037e89000000000000000000000000000000000000000000000000112210f4768db400000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000226d77735a77386e4637704b78574838656f4b4c39745078547061466b7a3751654c550000000000000000000000000000000000000000000000000000000000008208fda0575c288a449935a857409f96b0e655f917d383f02ae7a71ec7b9433534ac22eda05e7063b07c9816334e36251ccdd3eca8d360b3adb12078fe605ee30d32e15a12', 'hex'))
    }
  }]
}

it('should craft dftx with OP_CODES._()', () => {
  const stack = [
    OP_CODES.OP_RETURN,
    OP_CODES.OP_DEFI_TX_TRANSFER_DOMAIN(transferDomain)
  ]

  const buffer = toBuffer(stack)
  expect(buffer.toString('hex')).toStrictEqual(header + data)
})

describe('Composable', () => {
  it('should compose from buffer to composable', () => {
    const buffer = SmartBuffer.fromBuffer(Buffer.from(data, 'hex'))
    const composable = new CTransferDomain(buffer)

    expect(composable.toObject()).toStrictEqual(transferDomain)
  })

  it('should compose from composable to buffer', () => {
    const composable = new CTransferDomain(transferDomain)
    const buffer = new SmartBuffer()
    composable.toBuffer(buffer)

    expect(buffer.toBuffer().toString('hex')).toStrictEqual(data)
  })
})