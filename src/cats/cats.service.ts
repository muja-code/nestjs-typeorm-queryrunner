import { Injectable, ForbiddenException } from '@nestjs/common';
import { CatInterface } from './interfaces/cat.interface';
import { Cat } from './db/cats.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

@Injectable()
export class CatsService {
  constructor(
    @InjectRepository(Cat) private catsRepository: Repository<Cat>,
    private dataSource: DataSource
  ) {}
  async create(cat: CatInterface) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');
    try {
      const cats = await queryRunner.manager
        .getRepository(Cat)
        .find({ where: { deleteAt: null } });

      // const cats = await this.catsRepository.find({
      //   where: { deleteAt: null },
      // });

      if (cats.length > 2) throw new Error('동시성 제어 가능?');

      await queryRunner.manager.getRepository(Cat).insert({
        name: cat.name,
        age: cat.age,
        breed: cat.breed,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log('동시성 제어 err', err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<CatInterface[]> {
    return this.catsRepository.find();
  }

  deleteCat(id: number) {
    this.catsRepository.softDelete(id);
  }
}
