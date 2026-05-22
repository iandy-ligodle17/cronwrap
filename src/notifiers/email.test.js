const emailNotifier = require('./email');

// Mock nodemailer
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = jest.fn().mockReturnValue({
  sendMail: mockSendMail,
});

jest.mock('nodemailer', () => ({
  createTransport: mockCreateTransport,
}));

const baseOptions = {
  to: 'alerts@example.com',
  from: 'cronwrap@example.com',
  smtpConfig: { host: 'smtp.example.com', port: 587 },
};

describe('emailNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws if "to" is missing', () => {
    expect(() => emailNotifier({ from: 'a@b.com', smtpConfig: {} })).toThrow('"to" is required');
  });

  test('throws if "from" is missing', () => {
    expect(() => emailNotifier({ to: 'a@b.com', smtpConfig: {} })).toThrow('"from" is required');
  });

  test('throws if "smtpConfig" is missing', () => {
    expect(() => emailNotifier({ to: 'a@b.com', from: 'b@c.com' })).toThrow('"smtpConfig" is required');
  });

  test('returns a function', () => {
    const notify = emailNotifier(baseOptions);
    expect(typeof notify).toBe('function');
  });

  test('calls sendMail with correct fields on failure', async () => {
    const notify = emailNotifier(baseOptions);
    const error = new Error('timeout');
    await notify({ jobName: 'my-job', error, duration: 1200 });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('alerts@example.com');
    expect(mail.from).toBe('cronwrap@example.com');
    expect(mail.subject).toContain('my-job');
    expect(mail.text).toContain('timeout');
    expect(mail.text).toContain('1200ms');
  });

  test('uses custom subject when provided', async () => {
    const notify = emailNotifier({ ...baseOptions, subject: 'Custom Alert' });
    await notify({ jobName: 'my-job', error: new Error('oops'), duration: 500 });
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.subject).toBe('Custom Alert');
  });

  test('handles missing error gracefully', async () => {
    const notify = emailNotifier(baseOptions);
    await notify({ jobName: 'my-job', error: null, duration: 300 });
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.text).toContain('Unknown error');
  });
});
