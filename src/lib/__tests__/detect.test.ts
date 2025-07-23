import { getIpAddress } from '../ip';
import { detectAppOs, detectAppDevice } from '../detect';

const IP = '127.0.0.1';
const BAD_IP = '127.127.127.127';

test('getIpAddress: Custom header', () => {
  process.env.CLIENT_IP_HEADER = 'x-custom-ip-header';

  expect(getIpAddress(new Headers({ 'x-custom-ip-header': IP }))).toEqual(IP);
});

test('getIpAddress: CloudFlare header', () => {
  expect(getIpAddress(new Headers({ 'cf-connecting-ip': IP }))).toEqual(IP);
});

test('getIpAddress: Standard header', () => {
  expect(getIpAddress(new Headers({ 'x-forwarded-for': IP }))).toEqual(IP);
});

test('getIpAddress: CloudFlare header is lower priority than standard header', () => {
  expect(getIpAddress(new Headers({ 'cf-connecting-ip': BAD_IP, 'x-forwarded-for': IP }))).toEqual(
    IP,
  );
});

test('getIpAddress: No header', () => {
  expect(getIpAddress(new Headers())).toEqual(null);
});

test.each([
  ['os=Android; device=mobile', 'Android'],
  ['os=iOS; device=mobile', 'iOS'],
])('detectAppOs: %s should return %s', (input, expected) => {
  const actual = detectAppOs(input);
  expect(actual).toBe(expected);
});

test.each([
  ['os=Android; device=mobile', 'mobile'],
  ['os=iOS; device=mobile', 'mobile'],
  ['os=iPad; device=tablet', 'tablet'],
])('detectAppDevice: %s should return %s', (input, expected) => {
  const actual = detectAppDevice(input);
  expect(actual).toBe(expected);
});
