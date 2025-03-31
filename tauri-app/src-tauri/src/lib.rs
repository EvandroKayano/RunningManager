use serde::{Deserialize, Serialize};
use chrono::{Utc, DateTime}; // Ensure DateTime is imported
use serde_with::serde_as;
use serde_json;

// #[derive(Serialize, Deserialize)]
// pub enum Graduacao{
//     BRIG(String),
//     CEL(String),
//     TENCEL(String),
//     MAJ(String),
//     CAP(String),
//     TEN(String),
//     SO(String),
//     SGT1(String),
//     SGT2(String),
//     SGT3(String),
//     CB(String),
//     S1(String),
//     S2(String),
//     CV(String),
// }

// impl Graduacao{
//     fn as_str(&self) -> &str{
//         match self{
//             Graduacao::BRIG(s) => s,
//             Graduacao::CEL(s) => s,
//             Graduacao::TENCEL(s) => s,
//             Graduacao::MAJ(s) => s,
//             Graduacao::CAP(s) => s,
//             Graduacao::TEN(s) => s,
//             Graduacao::SO(s) => s,
//             Graduacao::SGT1(s) => s,
//             Graduacao::SGT2(s) => s,
//             Graduacao::SGT3(s) => s,
//             Graduacao::CB(s) => s,
//             Graduacao::S1(s) => s,
//             Graduacao::S2(s) => s,
//             Graduacao::CV(s) => s,
//         }
//     }
// }

// #[derive(Serialize, Deserialize)]
// #[serde(rename_all = "lowercase")]
// #[serde(remote = "StatusCorrida")]
// pub enum StatusCorrida{
//     COMPLETOU(String),    
//     FALTOU(String),    
//     NAOINICIADA(String),    
//     ACIDENTE(String)
// }

// impl StatusCorrida{
//     fn as_str(&self) -> &str {
//         match self {
//             StatusCorrida::COMPLETOU(s) => s,
//             StatusCorrida::FALTOU(s) => s,
//             StatusCorrida::NAOINICIADA(s) => s,
//             StatusCorrida::ACIDENTE(s) => s,
//         }
//     }
// }


#[serde_as]
#[derive(Deserialize, Serialize)]
pub struct Corredor{
    pub nome_corredor: String,
    pub numero_corredor: u32,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub data_nascimento: DateTime<Utc>,
    pub graduacao: String, //Graduacao,
    pub status_corrida: String, //StatusCorrida,
    pub genero: bool, // 0 para feminino e 1 para masculino
    pub tempo_chegada: u32
}

#[tauri::command]
fn create_corredor(    nome_corredor: String,
    numero_corredor: u32,
    data_nascimento: i64,
    graduacao: String, //Graduacao,
    status_corrida: String, //StatusCorrida,
    genero: bool, // 0 para feminino e 1 para masculino
    tempo_chegada: u32) -> String {
    let nome = nome_corredor;
    let numero = numero_corredor;
    let data = DateTime::from_timestamp(data_nascimento, 0).expect("invalid timestamp");
    let graduacao = graduacao;
    let status = status_corrida;
    let genero = if genero {true} else {false};
    let tempo = tempo_chegada;
    let runner = Corredor{nome_corredor:nome.clone(),numero_corredor: numero, data_nascimento: data, graduacao: graduacao, status_corrida:status, genero: genero,tempo_chegada:tempo};
    let json = serde_json::to_string(&runner).unwrap();

    json
}

#[serde_as]
#[derive(Deserialize, Serialize)]
pub struct Corrida{
    pub nome_corrida: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub data_criacao: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub data_corrida: DateTime<Utc>,
    pub total_corredores: u32,
    pub corredores: Vec<Corredor>
}
impl Corrida{
    fn new(nome_corrida:String, data_criacao:DateTime<Utc>, data_corrida:DateTime<Utc>, total_corredores:u32, corredores:Vec<Corredor>) -> Self{
        Corrida {nome_corrida, data_criacao, data_corrida, total_corredores, corredores}
    }
}

#[tauri::command]
fn create_corrida(form_data: Corrida) -> String {
    let nome = &form_data.nome_corrida;
    let data = form_data.data_corrida;
    let criacao = form_data.data_criacao;
    let total = form_data.total_corredores;
    let pessoas = &form_data.corredores
    .iter()
    .map(|corredor|format!(
        "{{\"nome_corredor\":\"{}\",\"numero_corredor\":{},\"aniversario\":\"{}\",\"graduacao\":\"{:?}\",\"status_corrida\":\"{:?}\",\"genero\":\"{}\",\"tempo_chegada\":\"{}\"}}",
        corredor.nome_corredor,
        corredor.numero_corredor,
        corredor.data_nascimento, 
        corredor.graduacao.as_str(),  
        corredor.status_corrida.as_str(),
        if corredor.genero { "masculino" } else { "feminino" }, // Convertendo o booleano para string
        corredor.tempo_chegada 
    ))
    .collect::<Vec<String>>()
    .join(",");
    let runners = form_data.corredores;

    let race = Corrida::new(nome.clone(),criacao,data,total,runners);
    let json = serde_json::to_string(&race).unwrap();

    json
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![create_corrida, create_corredor])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
