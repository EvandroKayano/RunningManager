import {Provider} from "../components/ui/provider";
import { Field, Button, Box, Text, Input, Stack, Table, Dialog, Portal, VStack, HStack, CloseButton, RadioGroup, Select, createListCollection } from "@chakra-ui/react"
import { useParams, useNavigate } from "react-router-dom";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useState, useEffect, useRef, useMemo } from 'react';
//import { useTable, useSortBy } from 'react-table';
import { RiArrowLeftLine } from "react-icons/ri";
import { invoke } from "@tauri-apps/api/core";
import dayjs from "dayjs";
import TabelaCorredores from "./TabelaCorredores";

async function getCorrida(corridaId: number){
    try {
        // conseguir a corrida especifica do JSON
        const filePath = await appLocalDataDir() + `\\RunManager\\corrida_${corridaId}.json`;
        const fileContents = await readTextFile(filePath);
        const corrida = JSON.parse(fileContents);
        if(corrida){
            return corrida;
        }
        else{
            console.log("Corrida não encontrada.");
        }
    } 
    catch (error) {
        console.error("Erro ao tentar encontrar corrida:", error);
        return null;
    }
}

function unixToDate(time : number | undefined){
    if(!time){
        return "";
    }
    const data = new Date(time*1000);
    if(isNaN(data.getTime())) {
        return "";
    }
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth()+1).padStart(2, "0");
    const ano = data.getFullYear();

    return `${ano}-${mes}-${dia}`;
}

async function updateRaceData(id:number, updatedCorrida: any) {
    try {
        const filePath = await appLocalDataDir() + `\\RunManager\\corrida_${id}.json`;
        const fileContents = await readTextFile(filePath);
        const corrida = JSON.parse(fileContents);

        await writeTextFile(filePath, JSON.stringify(updatedCorrida, null, 2));
        console.log("Nova Corrida atualizada:", corrida);
    } 
    catch (error) {
        console.error("Erro ao atualizar a corrida:",error);    
    }
}

function EditRun(){
    const contentRef = useRef<HTMLDivElement>(null);
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const [corrida, setCorrida] = useState<any>(null);
    const [corredorFormData, setCorredorFormData] = useState({
        nomeCorredor: "",
        numeroCorredor: 0,
        dataNascimento:"",
        graduacao: "",
        statusCorrida:"NAOINICIADA",
        genero: false,
        tempoChegada: 0
    })

    useEffect(() => {
        const fetchCorrida = (async() => {
            const corrida = await getCorrida(Number(id));
            if(corrida) setCorrida(corrida);
        });

        if(id){
            fetchCorrida();
        }
    }, [id]);


    const handleRaceDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        if(name === "data_corrida"){
            const date = new Date(value);
            date.setDate(date.getDate() + 1)
            const unixTimestamp = Math.floor(date.getTime() / 1000);
            setCorrida((oldData: any) => ({
                ...oldData,
                data_corrida: unixTimestamp,
            }))
        }
        else{
            setCorrida((oldData: any) => ({
                ...oldData,
                [name]: value
            }))
        }
            
        // pega como padrão os dados já inseridos, e sobreescreve com os novos dados

    }
    
    const handleRaceDataSubmit = async () => {
        await updateRaceData(Number(id), corrida);
        navigate(`/`);
    }

    const graduacaoOptions = createListCollection({
        items: [
            {label: 'BRIG', value: '1'},
            {label: 'CEL', value: '2'},
            {label: 'TENCEL', value: '3'},
            {label: 'MAJ', value: '4'},
            {label: 'CAP', value: '5'},
            {label: 'TEN', value: '6'},
            {label: 'SO', value: '7'},
            {label: 'SGT1', value: '8'},
            {label: 'SGT2', value: '9'},
            {label: 'SGT3', value: '10'},
            {label: 'CB', value: '11'},
            {label: 'S1', value: '12'},
            {label: 'S2', value: '13'},
            {label: 'CV', value: '14'}
        ],
    });


    // const statusCorridaOptions = [
    //     'COMPLETOU', 'FALTOU', 'NAOINICIADA', 'ACIDENTE'
    // ];

    const generoOptions = [
        {value: "0", label: "F"},
        {value: "1", label: "M"}
    ]

    const inputCorredor = (e:React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const name = e.target.name;
        if(name == "graduacao"){
            setCorredorFormData({
                ...corredorFormData,
                graduacao: value
            })
        }
        if(name === "dataNascimento"){
            console.log("Valor ao clicar: ",value);
            const date = new Date(value);
            date.setDate(date.getDate() + 1)
            const unixTimestamp = Math.floor(date.getTime() / 1000);
            console.log("Valor formatado: ",unixTimestamp);
            setCorredorFormData((oldData: any) => ({
                ...oldData,
                dataNascimento: unixTimestamp,
            }))
        }
        else{
            setCorredorFormData((oldData) => ({
                ...oldData,
                [name]: value
            }));
        }
        console.log(corredorFormData);
    }

    const submitCorredor = async () => {
        try {
            
        const formattedData = {
            ...corredorFormData,
            numeroCorredor: corrida.corredores.length + 1,
            
        }
        formattedData.tempoChegada = Number(formattedData.tempoChegada);

        if(formattedData.genero){//if 1
            formattedData.genero = true;
        }
        else{
            formattedData.genero = false;
        }
        const responseCorredor = await invoke('create_corredor', {
            nomeCorredor: formattedData.nomeCorredor,
            numeroCorredor: formattedData.numeroCorredor,
            dataNascimento: formattedData.dataNascimento,
            graduacao: formattedData.graduacao,
            statusCorrida: formattedData.statusCorrida,
            genero: formattedData.genero,
            tempoChegada: formattedData.tempoChegada

        });
        console.log("Here's the runner result: ", responseCorredor);
        await insertInJson(responseCorredor);

        } 
        catch (error) {
            console.error("Erro ao cadastrar corredor: ",error);
        }
    }

    const insertInJson = async (response: any) => {
        // eu tenho o JSON da corrida, e do corredor que eu quero adicionar
        // eu vou adicionar o corredor no JSON da corrida, e depois salvar o JSON da corrida
        //corrida está como um "array"
        //console.log("DADOS DA CORRIDA:",corrida);
        //response está como um string (JSON), portanto preciso fazer o parse para transformar em um objeto
        //console.log("DADOS DO CORREDOR:", JSON.parse(response));

        const corredor = JSON.parse(response);
        const updatedCorrida = async() => {
            const updatedCorrida = {
                ...corrida,
                corredores: [...corrida.corredores, corredor]
            }
            return updatedCorrida;
        }
        const updatedCorridaData = await updatedCorrida();
        await updateRaceData(Number(id), updatedCorridaData);
        const corridaAtualizada = await getCorrida(Number(id));
        if(corridaAtualizada) setCorrida(corridaAtualizada);
        //console.log("DADOS DA CORRIDA ATUALIZADOS:", updatedCorridaData);

    }

    const print = ()=>{
        console.log(corrida);
    }






    if(!corrida){
        return <Text>Carregando...</Text>
    }

    return(
        <Provider>
            <Field.Root>
                <Field.Label>
                    Editar corrida ID:{id}~~
                    {corrida.nome_corrida}~~
                    {unixToDate(corrida.data_corrida)}~~
                    {corrida.total_corredores}
                </Field.Label>
                <Button onClick={()=>{navigate(`/`)}} colorPalette="teal"><RiArrowLeftLine /></Button>
            </Field.Root>

            <Box padding="4">
                <Text fontSize="2x1">Editar Corrida ID: {corrida.id}</Text>
                <Stack marginTop="4">
                    <Field.Root>
                        <Field.Label>Nome da Corrida</Field.Label>
                        <Input
                        name="nome_corrida"
                        value={corrida.nome_corrida}
                        onChange={handleRaceDataChange}
                        />
                    </Field.Root>
                    
                    <Field.Root>
                        <Field.Label>Data da Corrida</Field.Label>
                        <Input
                        name="data_corrida"
                        value={unixToDate(corrida.data_corrida)}
                        type="date"
                        onChange={handleRaceDataChange}
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Limite de corredores</Field.Label>
                        <Input
                        name="total_corredores"
                        value={corrida.total_corredores}
                        onChange={handleRaceDataChange}
                        />
                    </Field.Root>

                    <Button colorScheme="blue" marginTop="4" onClick={handleRaceDataSubmit}>
                    Salvar Alterações
                    </Button>

                        <VStack alignItems="start">
                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <Button 
                                    background="green.500" 
                                    display="flex"
                                    transition="background-color 0.2s ease"
                                    _hover={{bg: "green.600"}}
                                    onClick={print}
                                    >Registrar novo corredor</Button>
                                </Dialog.Trigger>
                                <Portal>
                                <Dialog.Backdrop/>
                                <Dialog.Positioner >
                                    <Dialog.Content >
                                    <Dialog.Header>
                                        <Dialog.Title>Dados do Corredor</Dialog.Title>
                                    </Dialog.Header>
                                    
                                     <Dialog.Body pb="3">
                                            <Select.Root 
                                            collection={graduacaoOptions} 
                                            size="sm"
                                            name="graduacao"
                                            onChange={inputCorredor}
                                            >
                                                <Select.HiddenSelect />
                                                <Select.Label>Posto/Graduação</Select.Label>
                                                <Select.Control>

                                                <Select.Trigger>
                                                    <Select.ValueText placeholder="Oficial, Graduado, Praça ou Civil" />
                                                </Select.Trigger>

                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>

                                                </Select.Control>
                                                
                                                <Portal container={contentRef}> 
                                                <Select.Positioner >
                                                    <Select.Content zIndex={1500}>
                                                        {graduacaoOptions.items.map((item) => (
                                                            <Select.Item item={item} key={item.value}> {item.label} </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Positioner>
                                                </Portal>

                                            </Select.Root>    
                                            
                                                <Field.Root>
                                                    <Field.Label>
                                                        Nome do corredor
                                                    </Field.Label>
                                                        <Input                                             
                                                        name="nomeCorredor"
                                                        value={corredorFormData.nomeCorredor}
                                                        onChange={inputCorredor} 
                                                        />
                                                </Field.Root>

                                                <Field.Root>
                                                    <Field.Label>
                                                        Gênero
                                                    </Field.Label>
                                                    <RadioGroup.Root                                                         
                                                        name="genero"
                                                        value={corredorFormData.genero.toString()}
                                                        onChange={inputCorredor} 
                                                        >
                                                        <HStack gap="6">
                                                            {generoOptions.map((opt)=>(
                                                                <RadioGroup.Item key={opt.value} value={opt.value}>
                                                                    <RadioGroup.ItemHiddenInput />
                                                                    <RadioGroup.ItemIndicator />
                                                                    <RadioGroup.ItemText>{opt.label}</RadioGroup.ItemText>
                                                                </RadioGroup.Item>
                                                            ))}
                                                        </HStack>
                                                    </RadioGroup.Root>
                                                </Field.Root>

                                                <Field.Root>
                                                    <Field.Label>
                                                        Data de Nascimento
                                                    </Field.Label>
                                                        <Input                                             
                                                        name="dataNascimento"
                                                        value={unixToDate(Number(corredorFormData.dataNascimento))}
                                                        type="date"
                                                        onChange={inputCorredor} 
                                                        />
                                                </Field.Root>
     
                                    </Dialog.Body>
       
                                    <Dialog.Footer>
                                        <Dialog.CloseTrigger asChild>
                                            <Button 
                                            background="green.500" 
                                            display="flex"
                                            transition="background-color 0.2s ease"
                                            _hover={{bg: "green.600"}}
                                            position="inherit"
                                            bottom="20px"
                                            right="25px"
                                            onClick={submitCorredor}
                                            >Adicionar Corredor</Button>
                                        </Dialog.CloseTrigger>                            
                                    </Dialog.Footer>
         
                                    <Dialog.CloseTrigger asChild>
                                        <CloseButton size="sm" />
                                    </Dialog.CloseTrigger>
                                    </Dialog.Content>
                                </Dialog.Positioner>
                                </Portal>
                            </Dialog.Root>
                        </VStack>

                        
                    <TabelaCorredores corredores={corrida.corredores}/>


                </Stack>
            </Box>
        </Provider>

    );
}

export default EditRun;