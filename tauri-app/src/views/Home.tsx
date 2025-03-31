import { useState,useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readDir, readTextFile, writeTextFile, BaseDirectory, remove, rename } from "@tauri-apps/plugin-fs";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { 
    Table,
    Box, 
    Field,
    Input, 
    Stack,
    Button,
    Dialog,
    VStack,
    Portal,
    CloseButton } from "@chakra-ui/react";
import { Provider } from "../components/ui/provider";
import {useNavigate} from 'react-router-dom';

async function documents() {
    const p = await appLocalDataDir();
    return p  + "\\RunManager";
}

try {
    const dirPath = await documents();
    const dirExists = await exists(dirPath);
    if(!dirExists){
        try {
            await mkdir(dirPath);
            console.log("Diretório criado.");
        } catch (error) {
            console.error("Erro ao criar diretório: ", error);
        }
    }
    else
        console.log("Diretório já existe.")
} 
catch (error) {
    console.error("Erro ao verificar diretório: ", error);
}

// (onEdit)
const Home = () => {
    const [formData, setFormData] = useState ({
        nome_corrida: "",
        data_criacao: Math.floor(new Date().getTime()/1000),
        data_corrida: Math.floor(new Date().getTime()/1000),
        total_corredores: 0,
        corredores: []
    })

    const input = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const name = e.target.name;
        const total = isNaN(Number(value)) ? 0 : Math.floor(Number(value));
        setFormData({
            ...formData,
            [name]: value,
            total_corredores: total
        });
    };

    const submit = async () => {
        try {
            const info = {
                ...formData,
                corredores: formData.corredores.length === 0 ? [] : formData.corredores
            }
            console.log("printando os dados",info)
            info.total_corredores = Number(info.total_corredores);
            // returns a JSON for the race
            const response = await invoke('create_corrida',{formData: info});
            await createRaceJSON(response);
            console.log("Resposta: ",response)

        } catch (error) {
            console.log("Erro ao enviar os dados:" + error)
        }
    }

    useEffect(() => {
        async function readBackup(){        
            try {
                const dir = await appLocalDataDir();
                const filePath = dir + '\\RunManager';
                const jsonFiles = await readDir(filePath);
                const allRaces = [];
                 for (const file of jsonFiles){
                    if(file.isFile && file.name && file.name.endsWith('.json')){
                        const fileContents = JSON.parse(await readTextFile(filePath + "\\" + file.name));
                        allRaces.push(fileContents);
                    }
                 }
    
                setRaces(allRaces);
            } catch (error) {
                console.log("Erro ao ler os arquivos de backup:",error);
            }   
        }

        readBackup();
    },[]);


    const [races, setRaces] = useState<any[]>([]);

    const createRaceJSON = async (response:any) => {
        try {
            // converte pra string
            const newRace = typeof response === 'string' ? JSON.parse(response) : response;
            newRace.id = races.length;
            // path para guardar corrida
            const dir = await appLocalDataDir();
            const filePath = dir + '\\RunManager';

            if(races.length > 0){ 
                let oldRaces = [];
                try {
                    const fileContents = await readTextFile(filePath + "\\corridas.json");
                    //pega o JSON e transforma em um array
                    oldRaces = JSON.parse(fileContents);
                } 
                catch (error) {
                    console.log("Arquivo não encontrado, criando novo arquivo...");
                }
            }

            // path para nova corrida
            const raceName = `corrida_${newRace.id}.json`;
                        
            // atualizar races
            setRaces((prevRaces) => {
                const updatedRaces = [...prevRaces, newRace];
                return updatedRaces;
            });

            // converte lista de corridas em um JSON
            const racesListJSON = JSON.stringify(newRace, null,2);
            // salvar arquivo como JSON
            await writeTextFile(`${filePath}\\${raceName}`, racesListJSON,{ baseDir: BaseDirectory.AppLocalData });
            console.log(`Corrida ${newRace.nome_corrida} salva como ${raceName}`)
        } 
        catch (error) {
            console.error("Erro ao tratar a resposta da corrida:", error);
        }
    }

    const removeRaceJSON = async (raceId:number) => {
        // a corrida quando removida, deverá ser iterado os arquivos json e refeita os ids e assim o nome das corridas
        const toBeRemoved = races.find((c:any) => c.id === raceId);
        if(!toBeRemoved){
            console.log("Corrida não encontrada")
            return;
        }

        console.log("Essa foi a corrida que você clicou: ",toBeRemoved[raceId]);

        const dir = await documents();
        let tempRaces = [...races];
        tempRaces.sort((a:any, b:any)=> a.id - b.id);
        
        for(let i=0; i<tempRaces.length;i++){

            if(tempRaces[i].id < raceId){
                console.log("raceId < index")
                console.log("");
            }
            else{ // == || >
                console.log("raceId >= index")
                // se for a última corrida
                if(raceId === tempRaces[i].id && raceId === tempRaces.length-1){
                    console.log("é a última corrida")
                    await remove(`${dir}\\corrida_${raceId}.json`);
                }
                else{

                    if(raceId === 0 && tempRaces[i].id === 0){
                        console.log("Ignorada a primeira iteração")
                        continue;
                    }
                    const oldPath = `${dir}\\corrida_${i}.json`;
                    const newPath = `${dir}\\corrida_${i - 1}.json`;

                    try {
                        rename(oldPath, newPath);
                        console.log(`Arquivo renomeado: ${oldPath} -> ${newPath}`);
                    } 
                    catch (error) {
                        console.error(`Erro ao renomear ${oldPath} -> ${newPath}:`, error);
                    }
    
                    const raceContents = JSON.parse(await readTextFile(newPath));
                    raceContents.id = i-1;
    
                    writeTextFile(newPath, JSON.stringify(raceContents, null, 2));

                }
            }
        }

        
        setRaces(tempRaces);
        setTimeout(()=>{
            window.location.reload();
        }, 100);
        console.log("Lista de corridas após a remoção:", tempRaces);


    }

    function calculaData(time : number){
        const data = new Date(time*1000);
        const dia = data.getDate();
        const mes = data.getMonth()+1;
        const ano = data.getFullYear();

        if(mes < 10)
            return `${dia}/0${mes}/${ano}`;
        else
            return `${dia}/${mes}/${ano}`;
    }

    const navigate = useNavigate();
    const handleNavigate = (id:number) => {
        navigate(`/edit-race/${id}`);
    }

    return(
        <Provider>
    

            <Box display="flex" justifyContent="center" alignItems="center">
                <Stack>


                <VStack alignItems="start">
                    <Dialog.Root>
                        <Dialog.Trigger asChild>
                            <Button 
                            background="green.500" 
                            display="flex"
                            transition="background-color 0.2s ease"
                            _hover={{bg: "green.600"}}
                            >Criar nova corrida</Button>
                        </Dialog.Trigger>
                        <Portal>
                        <Dialog.Backdrop/>
                        <Dialog.Positioner >
                            <Dialog.Content > {/*backgroundColor="#1e70ff" */}
                            <Dialog.Header>
                                <Dialog.Title>Nova corrida</Dialog.Title>
                            </Dialog.Header>
                            
                            <Dialog.Body pb="3">

                                        <Field.Root>

                                            <Field.Root required>
                                            <Field.Label>
                                                Nome da corrida <Field.RequiredIndicator />
                                            </Field.Label>
                                                <Input                                             
                                                name="nome_corrida"
                                                value={formData.nome_corrida}
                                                placeholder="Corrida da..." 
                                                onChange={input} 
                                                />
                                            </Field.Root>

                                        </Field.Root>
                                        <Field.Root>
                                            <Field.Label>
                                                Número de corredores
                                            </Field.Label>
                                                <Input                                             
                                                name="total_corredores"
                                                value={formData.total_corredores}
                                                placeholder="50, 100, 150..."
                                                onChange={input} 
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
                                    onClick={submit}
                                    >Criar nova corrida</Button>
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

                    <Table.Root key={"outline"} size="sm" variant={"outline"} showColumnBorder >
        
                    <Table.ColumnGroup>
                        <Table.Column/>
                        <Table.Column/>
                        <Table.Column/>
                        <Table.Column/>
                        <Table.Column/>
                    </Table.ColumnGroup>

                    <Table.Header>
                        <Table.Row>
                        <Table.ColumnHeader textAlign="center">ID</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Nome da Corrida</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Data de Criação</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Data da Corrida</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Total de Corredores</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center"></Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
        
                    <Table.Body>
                        {races.length > 0 ? 
                            (
                                races.map((race) => (
                                <Table.Row
                                    key={race.id}
                                    onClick={() => {
                                    handleNavigate(race.id);
                                    }}
                                    cursor="pointer"
                                    transition="background-color 0.2s ease"
                                    _hover={{ bg: "gray.400" }}
                                >
                                    <Table.Cell textAlign="center">{race.id}</Table.Cell>
                                    <Table.Cell textAlign="center">{race.nome_corrida}</Table.Cell>
                                    <Table.Cell textAlign="center">{calculaData(race.data_criacao)}</Table.Cell>
                                    <Table.Cell textAlign="center">{calculaData(race.data_corrida)}</Table.Cell>
                                    <Table.Cell textAlign="center">
                                    {race.corredores.length} / {race.total_corredores}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Button 
                                        colorPalette="red"
                                        onClick={() => {
                                            removeRaceJSON(race.id);
                                        }}
                                        >X</Button>
                                    </Table.Cell>
                                    
                                </Table.Row>
                                ))
                            ):
                            (
                                <Table.Row>
                                    <Table.Cell colSpan={5} textAlign="center">
                                        Nenhuma corrida encontrada
                                    </Table.Cell>
                                </Table.Row>
                            )
                        }
                    </Table.Body>
                    </Table.Root>
                </Stack>
            </Box>
    
        </Provider>
    );
  };
  
  export default Home;