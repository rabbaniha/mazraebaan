import { ulid } from 'ulid';
import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  interface FakeOutboxRow {
    id: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    status: string;
    createdAt: Date;
    publishedAt: Date | null;
  }

  const makeRow = (overrides: Partial<FakeOutboxRow> = {}): FakeOutboxRow => ({
    id: ulid(),
    eventType: 'account.provisioning.requested',
    aggregateType: 'onboarding_session',
    aggregateId: ulid(),
    payload: { userId: ulid() },
    status: 'pending',
    createdAt: new Date(),
    publishedAt: null,
    ...overrides,
  });

  const setup = () => {
    const rows: Array<Record<string, unknown>> = [];
    const repo = {
      find: jest.fn((): Promise<unknown[]> => Promise.resolve([...rows])),
      update: jest.fn((_where: unknown, patch: Record<string, unknown>) => {
        for (let i = 0; i < rows.length; i++) {
          rows[i] = { ...rows[i], ...patch };
        }
        return Promise.resolve();
      }),
      create: jest.fn((x: Record<string, unknown>) => ({ ...x })),
      save: jest.fn((x: Record<string, unknown>) => {
        rows.push(x);
        return Promise.resolve(x);
      }),
    };
    const publisher = {
      publish: jest.fn(
        (
          _routingKey: string,
          _payload: Record<string, unknown>,
        ): Promise<void> => Promise.resolve(),
      ),
      logConnectionError: jest.fn(),
    };
    const manager = { getRepository: () => repo } as never;
    const service = new OutboxService(repo as never, publisher as never);
    return { service, repo, publisher, manager, rows: () => rows };
  };

  it('enqueue inserts a pending row via the transactional manager', async () => {
    const { service, repo, manager } = setup();

    await service.enqueue(manager, {
      eventType: 'account.provisioning.requested',
      aggregateType: 'onboarding_session',
      aggregateId: ulid(),
      payload: {},
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0][0] as {
      status: string;
      eventType: string;
    };
    expect(saved.status).toBe('pending');
    expect(saved.eventType).toBe('account.provisioning.requested');
  });

  it('publishPending publishes oldest-first and marks rows published', async () => {
    const { service, repo, publisher } = setup();
    const older = makeRow({ createdAt: new Date(2020, 0, 1) });
    const newer = makeRow({ createdAt: new Date(2021, 0, 1) });
    repo.find.mockResolvedValue([newer, older] as never);

    const count = await service.publishPending();

    expect(count).toBe(2);
    expect(publisher.publish).toHaveBeenCalledWith(
      newer.eventType,
      newer.payload,
    );
    expect(repo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('stops at the first publish failure and leaves rows pending', async () => {
    const { service, repo, publisher } = setup();
    const row = makeRow();
    repo.find.mockResolvedValue([row] as never);
    (publisher.publish as jest.Mock).mockRejectedValue(
      new Error('broker down'),
    );

    const count = await service.publishPending();

    expect(count).toBe(0);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
