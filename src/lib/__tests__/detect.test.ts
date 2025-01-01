import * as detect from '../detect';
import { expect } from '@jest/globals';

const IP = '127.0.0.1';

test('getIpAddress: Custom header', () => {
  process.env.CLIENT_IP_HEADER = 'x-custom-ip-header';

  expect(detect.getIpAddress({ headers: { 'x-custom-ip-header': IP } } as any)).toEqual(IP);
});

test('getIpAddress: CloudFlare header', () => {
  expect(detect.getIpAddress({ headers: { 'cf-connecting-ip': IP } } as any)).toEqual(IP);
});

test('getIpAddress: Standard header', () => {
  expect(detect.getIpAddress({ headers: { 'x-forwarded-for': IP } } as any)).toEqual(IP);
});

test('getIpAddress: No header', () => {
  expect(detect.getIpAddress({ headers: {} } as any)).toEqual(null);
});

test.each([
  ['os=Android; device=mobile', 'Android'],
  ['os=iOS; device=mobile', 'iOS'],
])('detectAppOs: %s should return %s', (input, expected) => {
  const actual = detect.detectAppOs(input);
  expect(actual).toBe(expected);
});

test.each([
  ['os=Android; device=mobile', 'mobile'],
  ['os=iOS; device=mobile', 'mobile'],
  ['os=iPad; device=tablet', 'tablet'],
])('detectAppDevice: %s should return %s', (input, expected) => {
  const actual = detect.detectAppDevice(input);
  expect(actual).toBe(expected);
});
