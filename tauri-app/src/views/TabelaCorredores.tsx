import React, { useMemo } from 'react';
import { useTable, useSortBy, Column, Row } from 'react-table';
import { Table } from "@chakra-ui/react"
import dayjs from 'dayjs';

type Corredor = {
    nome_corredor: string;
    numero_corredor: number;
    data_nascimento: number; // Unix timestamp (segundos)
    graduacao: string;
    status_corrida: string;
    genero: boolean;
    tempo_chegada: number;
};

interface Props {
    corredores: Corredor[];
};

const graduacaoMap = new Map([
  ['BRIG', 1],
  ['CEL', 2],
  ['TENCEL', 3],
  ['MAJ', 4],
  ['CAP', 5],
  ['TEN', 6],
  ['SO', 7],
  ['SGT1', 8],
  ['SGT2', 9],
  ['SGT3', 10],
  ['CB', 11],
  ['S1', 12],
  ['S2', 13],
  ['CV', 14],
]);


const TabelaCorredores: React.FC<Props> = ({ corredores }) => {
    const data = useMemo<Corredor[]>(() => corredores, [corredores]);
  
    const columns = useMemo<Column<Corredor>[]>(() => [
      {
        Header: 'Número',
        accessor: 'numero_corredor',
        Cell: ({ value }) => value,
      },
      {
        Header: 'Nome',
        accessor: 'nome_corredor',
        Cell: ({ value }) => value,
      },
      {
        Header: 'Nascimento',
        accessor: 'data_nascimento',
        Cell: ({ value }) => dayjs.unix(value).format('DD/MM/YYYY'),
      },
      {
        Header: 'Graduação',
        accessor: 'graduacao',
        Cell: ({ value }) => value,
        sortType: (rowA: Row<Corredor>, rowB: Row<Corredor>) => {
          const a = graduacaoMap.get(rowA.values.graduacao) ?? 999;
          const b = graduacaoMap.get(rowB.values.graduacao) ?? 999;
          return a - b;
        }
      },
      {
        Header: 'Status',
        accessor: 'status_corrida',
        Cell: ({ value }) => value,
      },
      {
        Header: 'Gênero',
        accessor: 'genero',
        Cell: ({ value }) => value ? 'Masculino' : 'Feminino',
      },
      {
        Header: 'Tempo de Chegada',
        accessor: 'tempo_chegada',
        Cell: ({ value }) => value,
      },
    ], []);
  
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
    } = useTable<Corredor>({ columns, data }, useSortBy);
  
    return (
            
      <Table.Root {...getTableProps()} key={"outline"} size="sm" variant={"outline"} showColumnBorder>
        <Table.Header>
          {headerGroups.map(headerGroup => (
            <Table.Row {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
              {headerGroup.headers.map(column => (
                <Table.Cell
                    {...(column as any).getSortByToggleProps()}
                    key={column.id}
                    textAlign={"center"}
                    _hover={{ cursor: 'pointer', bg: 'gray.400' }}  
                >
                    {column.render('Header')}
                    {(column as any).isSorted
                    ? (column as any).isSortedDesc
                        ? ' ↓'
                        : ' ↑'
                    : ''}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Header>

        <Table.Body {...getTableBodyProps()}>
          {rows.map((row: Row<Corredor>) => {
            prepareRow(row);
            return (
              <Table.Row 
                {...row.getRowProps()} key={row.id}>
                {row.cells.map(cell => (
                  <Table.Cell 
                    {...cell.getCellProps()} 
                    textAlign="center"
                    justifyContent="center"
                    key={cell.column.id} >

                        {cell.render('Cell')}
                        
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>
        
      </Table.Root>
    );
  };
  
  export default TabelaCorredores;