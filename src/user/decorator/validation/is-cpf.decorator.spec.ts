import { IsCpf } from './is-cpf.decorator';
import { validateSync } from 'class-validator';

class TestDto {
  @IsCpf()
  cpf!: string;
}

class TestDtoOptional {
  @IsCpf({ message: 'CPF inválido' })
  cpf?: string | null;
}

describe('IsCpf decorator', () => {
  const validCpfs = [
    '529.982.247-25',
    '52998224725',
    '111.444.777-35',
    '390.533.447-05',
  ];
  const invalidCpfs = [
    '111.111.111-11', // dígitos repetidos
    '529.982.247-24', // dígito verificador errado
    '123456789', // tamanho incorreto
    '123.456.789-01',
    'abc.def.ghi-jk',
  ];

  describe('validos', () => {
    it.each(validCpfs)('aceita %s', (cpf) => {
      const dto = new TestDto();
      dto.cpf = cpf;
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('inválidos', () => {
    it.each(invalidCpfs)('rejeita %s', (cpf) => {
      const dto = new TestDto();
      dto.cpf = cpf;
      const errors = validateSync(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('campo opcional', () => {
    it('aceita undefined', () => {
      const dto = new TestDtoOptional();
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita null', () => {
      const dto = new TestDtoOptional();
      dto.cpf = null;
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });

    it('aceita string vazia', () => {
      const dto = new TestDtoOptional();
      dto.cpf = '';
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });
  });

  it('rejeita valores não-string', () => {
    const dto = new TestDtoOptional();
    dto.cpf = 12345 as unknown as string;
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('usa a mensagem customizada quando fornecida', () => {
    const dto = new TestDtoOptional();
    dto.cpf = '000.000.000-00';
    const errors = validateSync(dto);
    expect(errors[0].constraints?.isCpf).toBe('CPF inválido');
  });

  it('retorna a mensagem padrão quando nenhuma é fornecida', () => {
    const dto = new TestDto();
    dto.cpf = '000.000.000-00';
    const errors = validateSync(dto);
    expect(errors[0].constraints?.isCpf).toBe('Invalid CPF format');
  });
});
