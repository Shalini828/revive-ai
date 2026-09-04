#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/169732f907e4d6c7801216bdd44d084b529786a3bf98ccee7e1022afc28992b8/contract';
import endContract from '../../snapshots/169732f907e4d6c7801216bdd44d084b529786a3bf98ccee7e1022afc28992b8/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/4c4ffb45ffd6ba0f6d3a927153ccd390389f4dfd5b9170631aad1dd627ac0747/contract';
import startContract from '../../snapshots/4c4ffb45ffd6ba0f6d3a927153ccd390389f4dfd5b9170631aad1dd627ac0747/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
