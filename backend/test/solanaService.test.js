import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidSolanaAddress, isValidTxSignature, validateNetwork } from '../config/solana.js';
import { normalizeTransaction, rpc, solanaService } from '../services/solanaService.js';

const signature = '1'.repeat(64);
const account = '11111111111111111111111111111111';

test('network validation accepts supported clusters and rejects unknown names', () => {
  for (const network of ['mainnet-beta', 'devnet', 'testnet']) assert.equal(validateNetwork(network), network);
  assert.throws(() => validateNetwork('mainnet'), { code: 'INVALID_NETWORK', statusCode: 400 });
});

test('address and signature validation checks decoded key lengths', () => {
  assert.equal(isValidSolanaAddress(account), true);
  assert.equal(isValidSolanaAddress('not-an-address'), false);
  assert.equal(isValidTxSignature(signature), true);
  assert.equal(isValidTxSignature('1'.repeat(63)), false);
  assert.equal(isValidTxSignature(`${signature}0`), false);
});

test('invalid signatures, slots, and account addresses fail before RPC access', async () => {
  await assert.rejects(solanaService.getTransaction('devnet', 'bad-signature'), { code: 'INVALID_INPUT', statusCode: 400 });
  await assert.rejects(solanaService.getBlockBySlot('devnet', '1e6'), { code: 'INVALID_INPUT', statusCode: 400 });
  await assert.rejects(solanaService.getAccountOverview('devnet', 'not-a-public-key'), { code: 'INVALID_INPUT', statusCode: 400 });
});

test('RPC wrapper times out and rejects instead of returning a placeholder', async () => {
  process.env.SOLANA_RPC_TIMEOUT_MS = '1000';
  process.env.SOLANA_RPC_MAX_RETRIES = '0';
  await assert.rejects(rpc(() => new Promise(() => {})), { code: 'RPC_TIMEOUT', statusCode: 504 });
  delete process.env.SOLANA_RPC_TIMEOUT_MS;
  delete process.env.SOLANA_RPC_MAX_RETRIES;
});

test('normalizer preserves successful and failed chain execution outcomes', () => {
  for (const err of [null, { InstructionError: [0, 'Custom'] }]) {
    const result = normalizeTransaction({ slot: 9, blockTime: null, transaction: { message: { accountKeys: [{ pubkey: { toBase58: () => account }, signer: true }], instructions: [] } }, meta: { err, fee: 5000, preBalances: [10000], postBalances: [5000] } }, signature, 'devnet');
    assert.equal(result.status, err ? 'Failed' : 'Success');
    assert.equal(result.fee, 0.000005);
    assert.equal(result.balanceChanges[0].changeSol, -0.000005);
    assert.equal(result.network, 'devnet');
  }
});

test('unknown metadata stays unavailable', () => {
  const result = normalizeTransaction({ slot: 2, transaction: { message: { accountKeys: [], instructions: [] } }, meta: null }, signature, 'testnet');
  assert.equal(result.status, 'Unavailable');
  assert.equal(result.fee, null);
  assert.equal(result.signer, null);
});

test('token account changes retain exact raw amounts with missing pre balance', () => {
  const tx = { slot: 3, transaction: { message: { accountKeys: [account], instructions: [] } }, meta: { fee: 1, preTokenBalances: [], postTokenBalances: [{ accountIndex: 0, mint: account, uiTokenAmount: { amount: '9007199254740993', decimals: 6 } }] } };
  const result = normalizeTransaction(tx, signature, 'mainnet-beta');
  assert.equal(result.tokenTransfers[0].rawAmount, '9007199254740993');
  assert.equal(result.tokenTransfers[0].type, 'Receive');
  assert.match(result.tokenTransfers[0].note, /not inferred/);
});

test('missing post token balance is represented as a full account decrease', () => {
  const tx = { slot: 3, transaction: { message: { accountKeys: [account], instructions: [] } }, meta: { fee: 1, preTokenBalances: [{ accountIndex: 0, mint: account, uiTokenAmount: { amount: '75', decimals: 2 } }], postTokenBalances: [] } };
  const result = normalizeTransaction(tx, signature, 'mainnet-beta');
  assert.equal(result.tokenTransfers[0].rawAmount, '75');
  assert.equal(result.tokenTransfers[0].type, 'Send');
});

test('parsed and partially decoded instructions retain program ids and raw data', () => {
  const programId = { toBase58: () => account };
  const tx = { slot: 3, transaction: { message: { accountKeys: [account], instructions: [
    { programId, program: 'system', parsed: { type: 'transfer', info: {} }, accounts: [] },
    { programId, data: 'AQID', accounts: [0] },
  ] } }, meta: { fee: 1, innerInstructions: [{ index: 0, instructions: [{ programId, data: 'BAUG', accounts: [0] }] }] } };
  const result = normalizeTransaction(tx, signature, 'mainnet-beta');
  assert.equal(result.instructions[0].type, 'transfer');
  assert.equal(result.instructions[1].type, 'partially decoded');
  assert.equal(result.instructions[1].rawData, 'AQID');
  assert.equal(result.instructions[2].inner, true);
});

test('versioned transaction message account keys are normalized', () => {
  const tx = { slot: 4, transaction: { message: { accountKeys: [{ pubkey: { toBase58: () => account }, signer: true, source: 'lookupTable' }], instructions: [] } }, meta: { fee: 1, err: null } };
  const result = normalizeTransaction(tx, signature, 'mainnet-beta');
  assert.equal(result.signer, account);
  assert.equal(result.status, 'Success');
});
