const { describe, it, expect } = require('@jest/globals');
const { processSlashCommand, generateStripeSession, assignRole, revokeRole, handleErrors } = require('../src/botFunctions');

// モック関数とモックデータの設定
jest.mock('../src/botFunctions');

describe('Discord決済Botのテスト', () => {
  describe('スラッシュコマンドの処理', () => {
    it('1980円プランのスラッシュコマンドが正しく処理される', async () => {
      const response = await processSlashCommand('/subscribe plan=1980');
      expect(response).toContain('Stripe Checkoutセッションが生成されました');
    });

    it('4980円プランのスラッシュコマンドが正しく処理される', async () => {
      const response = await processSlashCommand('/subscribe plan=4980');
      expect(response).toContain('Stripe Checkoutセッションが生成されました');
    });

    it('不正なプランを指定したスラッシュコマンドがエラーを返す', async () => {
      const response = await processSlashCommand('/subscribe plan=9999');
      expect(response).toContain('無効なプランが指定されました');
    });
  });

  describe('Stripe Checkoutセッションの生成', () => {
    it('正しいStripe Checkoutセッションが生成される', async () => {
      const sessionUrl = await generateStripeSession('1980');
      expect(sessionUrl).toContain('https://checkout.stripe.com/pay/');
    });
  });

  describe('支払い完了後のロール付与', () => {
    it('支払い完了後にロールが付与される', async () => {
      const result = await assignRole('userId', '1980');
      expect(result).toBeTruthy();
    });
  });

  describe('サブスクリプション解約後のロール剥奪', () => {
    it('サブスクリプションが解約された場合にロールが剥奪される', async () => {
      const result = await revokeRole('userId');
      expect(result).toBeTruthy();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な入力が適切なエラーメッセージを返す', async () => {
      const response = await handleErrors('不正な入力');
      expect(response).toContain('エラーが発生しました');
    });
  });
});