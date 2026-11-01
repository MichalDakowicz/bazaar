import { canShareSignIn } from './pingBackends';
import { PING_APPS, pingApp } from './pingApps';

describe('shared Ping backend', () => {
  it('allows each pair of migrated Ping apps in both directions', () => {
    for (const self of PING_APPS) {
      for (const sibling of PING_APPS) {
        expect(canShareSignIn(self.key, sibling.key)).toBe(self.key !== sibling.key);
      }
    }
  });
  it('excludes separate products from the family', () => {
    expect(pingApp('radar')).toBeNull();
    expect(pingApp('cellar')).toBeNull();
  });
});
