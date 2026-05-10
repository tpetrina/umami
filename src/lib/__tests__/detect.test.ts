import { getIpAddress } from '../ip';
import { detectAppOs, detectAppDevice, skipEdgeLocationHeaders } from '../detect';

const IP = '127.0.0.1';
const BAD_IP = '127.127.127.127';

test('getIpAddress: Custom header', () => {
  process.env.CLIENT_IP_HEADER = 'x-custom-ip-header';

  expect(getIpAddress(new Headers({ 'x-custom-ip-header': IP }))).toEqual(IP);
});

test('getIpAddress: Custom header trims IPv6 (CLIENT_IP_HEADER)', () => {
  process.env.CLIENT_IP_HEADER = 'x-real-client-ip';

  const ipv6 = '2a02:aa7:410c:b9f:e537:3b2:1415:2815';

  expect(getIpAddress(new Headers({ 'x-real-client-ip': `  ${ipv6}  ` }))).toEqual(ipv6);
  expect(getIpAddress(new Headers({ 'x-real-client-ip': `"${ipv6}"` }))).toEqual(ipv6);
});

test('getIpAddress: CloudFlare header', () => {
  expect(getIpAddress(new Headers({ 'cf-connecting-ip': IP }))).toEqual(IP);
});

test('getIpAddress: Standard header', () => {
  expect(getIpAddress(new Headers({ 'x-forwarded-for': IP }))).toEqual(IP);
});

test('getIpAddress: No header', () => {
  expect(getIpAddress(new Headers())).toEqual(undefined);
});

describe('skipEdgeLocationHeaders', () => {
  const savedClientIpHeader = process.env.CLIENT_IP_HEADER;

  afterEach(() => {
    if (savedClientIpHeader === undefined) {
      delete process.env.CLIENT_IP_HEADER;
    } else {
      process.env.CLIENT_IP_HEADER = savedClientIpHeader;
    }
  });

  test('true when payload includes ip', () => {
    expect(skipEdgeLocationHeaders(new Headers({ 'cf-ipcountry': 'DE' }), { ip: '8.8.8.8' })).toBe(true);
  });

  test('true when CLIENT_IP_HEADER is set on the request', () => {
    process.env.CLIENT_IP_HEADER = 'x-real-client-ip';

    expect(
      skipEdgeLocationHeaders(
        new Headers({
          'x-real-client-ip': '2a02::1',
          'cf-ipcountry': 'DE',
        }),
        {},
      ),
    ).toBe(true);
  });

  test('false when env names a header that is absent (use CDN geo)', () => {
    process.env.CLIENT_IP_HEADER = 'x-real-client-ip';

    expect(
      skipEdgeLocationHeaders(new Headers({ 'cf-connecting-ip': IP, 'cf-ipcountry': 'US' }), {}),
    ).toBe(false);
  });
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
