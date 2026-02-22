'use client';

import React, { useState } from 'react';
import { Download, Code2, Wifi, Settings, Info, CreditCard, ChevronDown, CheckCircle, DatabaseZap, Power, Wrench, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ApiDocs({ envUrl, envAnonKey }: { envUrl: string, envAnonKey: string }) {
    const [openSection, setOpenSection] = useState<string | null>('fw');

    const toggle = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const hostname = envUrl ? new URL(envUrl).hostname : 'localhost';

    const generateFW = () => {
        const cppCode = `/* 
  ======================================================
  M.E.S. SHOPFLOOR - TERMINAL IoT (Hub NASA)
  Compilação Direcionada para NodeMCU ESP32 + RFID MFRC522
  Versão: 2.0 (Lean OEE & Controlo de Ausências)
  ======================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>

// --- REDE OBRIGATÓRIA DA FÁBRICA ---
// Substitua pelas credenciais seguras da VLAN de Produção
const char* ssid = "BRUNSWICK_WIFI_IOT";
const char* password = "SUA_PASSWORD_WPA2";

// --- ENDPOINTS M.E.S. CLOUD NEXT.JS ---
const char* api_url = "https://${hostname}/api/mes/iot";
const String auth_key = "Bearer ${envAnonKey.substring(0, 30)}... (Copiar do Ficheiro .env)";

// --- PINOUT PWD HARDWARE ---
#define RST_PIN    22
#define SS_PIN     21 
#define BOTAO_UP   12
#define BOTAO_DOWN 14
#define BOTAO_SEL  27

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 20, 4); 

// VARIAVEIS DE ESTADO DO DISPOSITIVO
String idEstacao = "ID_ESTACAO_BD_AQUI"; 
int menuEstado = 0; // 0=IDLE/PULL, 1=PONTO/NVA
int subMenuNvaIdx = 0;
String NVA_OPTIONS[] = {"PONTO", "WC", "FORMACAO", "MEDICO", "FALTA_MATERIAL"};
int NVA_MAX = 4;

void setup() {
  Serial.begin(115200);
  
  // 1. Iniciar LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0);
  lcd.print("BOOT SPERO Hub...");

  // 2. Iniciar SPI P/ RFID
  SPI.begin();
  rfid.PCD_Init();

  // 3. Pinos Pull-Up Internos
  pinMode(BOTAO_UP, INPUT_PULLUP);
  pinMode(BOTAO_DOWN, INPUT_PULLUP);
  pinMode(BOTAO_SEL, INPUT_PULLUP);

  // 4. Conectar Gateway
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { 
    lcd.setCursor(0,1); lcd.print("A Ligar Wi-Fi...");
    delay(1000); 
  }
  
  desenharIdle();
}

void loop() {
  leRfid();
  leBotoes();
  delay(100); // Polling CPU safe
}

// ----------------------------------------------------
// NÚCLEO LEITURA BOTOES (MAQUINA DE ESTADOS)
// ----------------------------------------------------
void leBotoes() {
  // BOTAO DOWN: Saltar para Menu Pausas/RH
  if (digitalRead(BOTAO_DOWN) == LOW) {
      if(menuEstado == 0) {
          menuEstado = 1; subMenuNvaIdx = 0;
          desenharMenuNVA();
      } else {
          // Ciclar Menu
          subMenuNvaIdx = subMenuNvaIdx < NVA_MAX ? subMenuNvaIdx + 1 : NVA_MAX;
          desenharMenuNVA();
      }
      delay(400); // Debounce
  }

  // BOTAO UP: Voltar ao Inicio OU Fechar Estacao
  if (digitalRead(BOTAO_UP) == LOW) {
      if(menuEstado == 1) {
         if(subMenuNvaIdx == 0) { menuEstado = 0; desenharIdle(); }
         else { subMenuNvaIdx--; desenharMenuNVA(); }
      } else {
         // Logica de Fecho Macro de Estacao (UP a partir do Menu Principal)
         lcd.clear(); lcd.print("Fechar Estacao?");
         lcd.setCursor(0,1); lcd.print("SEL p/ Confirmar");
         delay(1000);
         // Aguarda Confirmacao...
         while(digitalRead(BOTAO_SEL) == HIGH) { 
            if(digitalRead(BOTAO_UP) == LOW) { desenharIdle(); return; } // Cancela
         }
         enviarComandoEdge("FECHAR_ESTACAO", "MAC_MASTER", "");
         delay(2000); desenharIdle();
      }
      delay(400); // Debounce
  }

  // BOTAO SELECT: Puxar Kanban (Pull-System)
  if (digitalRead(BOTAO_SEL) == LOW && menuEstado == 0) {
      lcd.clear(); lcd.print("A Consultar Bd...");
      enviarComandoEdge("GET_NEXT_OP", "", "");
      delay(2000); // Espera mostrar o barco novo e nao faz reset automatico do idle
  }
}

// ----------------------------------------------------
// NÚCLEO LEITURA RFID E SUBMISSAO DE ACOES
// ----------------------------------------------------
void leRfid() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String hexCard = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    hexCard += String(rfid.uid.uidByte[i], HEX);
  }
  hexCard.toUpperCase();
  
  if (menuEstado == 1) { // Modo NVA / RH Activo
      String motivo = NVA_OPTIONS[subMenuNvaIdx];
      if (motivo == "PONTO") {
          enviarComandoEdge("PONTO", hexCard, "");
      } else {
          enviarComandoEdge("REGISTAR_PAUSA", hexCard, motivo);
      }
      delay(2000); desenharIdle(); menuEstado = 0;
  } 
  else { // Modo Normal OEE (Toggle de Tarefa no Barco Puxado)
      // Nota: o op_id real e gerido no Backend NodeJS pelo PULL, mas podes forcar se guardado
      enviarComandoEdge("TOGGLE_TAREFA", hexCard, "");
  }
  delay(1500); // Cooldown de Sensor Capacitivo
}

// ----------------------------------------------------
// COMUNICAÇÃO HTTP COM A CLOUD M.E.S.
// ----------------------------------------------------
void enviarComandoEdge(String accao, String colaboradorID, String optMotivo) {
   if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      http.begin(api_url);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", auth_key);
      
      // Construir Payload JSON Escapado
      String payload = "{\\"action\\":\\""+accao+"\\", \\"operador_rfid\\":\\""+colaboradorID+"\\", \\"estacao_id\\":\\""+idEstacao+"\\"";
      if(optMotivo != "") payload += ", \\"motivo_pausa\\":\\""+optMotivo+"\\"";
      payload += "}";

      int statusHttp = http.POST(payload);
      
      lcd.clear();
      if(statusHttp == 200){
         // SUCESSO! A API DEVE RESPONDER COM DADOS NO DISPLAY.
         // Uma libraria como ArduinoJson faria o parse da variavel \`display\` que a Next.js envia. 
         lcd.print("OK! BD Vercel");
      } else {
         lcd.print("Erro Rede: "); lcd.print(statusHttp);
      }
      http.end();
   }
}

// ----------------------------------------------------
// UTILS ECRÃ
// ----------------------------------------------------
void desenharIdle() {
  lcd.clear();
  lcd.print("Spero M.E.S.");
  lcd.setCursor(0,1); lcd.print("DWN: Pausas / NVA");
  lcd.setCursor(0,2); lcd.print("SEL: Prox. Barco");
}

void desenharMenuNVA() {
  lcd.clear();
  lcd.print("Menu RH (Cracha):");
  lcd.setCursor(0,1); lcd.print("-> " + NVA_OPTIONS[subMenuNvaIdx]);
}
`;

        const blob = new Blob([cppCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hub_nasa_esp32_fw.cpp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="w-full border-none shadow-xl overflow-hidden bg-white ring-1 ring-slate-200 mt-6 lg:mt-0">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-5">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Wrench className="text-blue-600" size={22} /> Engineering & Hardware Room
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">
                    Central de configurações para os técnicos elétricos embutirem o software nos ESP32. O código de Hardware comunica diretamente com a nuvem Vercel de forma limpa.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y divide-slate-100">

                    {/* Generador de C++ Otimizado */}
                    <div className="bg-white">
                        <button
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left focus:outline-none"
                            onClick={() => toggle('fw')}
                        >
                            <span className="font-bold flex items-center gap-2 text-slate-800">
                                <Code2 size={18} className="text-emerald-500" /> 1. Gerador de C++ c/ Tokens Vercel Injetados (ESP32)
                            </span>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'fw' ? 'rotate-180' : ''}`} />
                        </button>
                        {openSection === 'fw' && (
                            <div className="p-5 pt-0 bg-slate-50 text-sm border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg mt-3 flex flex-col gap-4">
                                    <div className="flex items-start gap-3">
                                        <ShieldAlert size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-slate-700 leading-relaxed font-medium">
                                            O código subjacente foi gerado assumindo o Host <strong>{hostname}</strong>. Ele inclui já a Máquina de Estados tática com 3 Botões Internos + Sensor MFRC522.<br />A lógica de Linha Puxada e "Menu OEE e Desperdícios (WC/Médico)" v2.0 estão embutidas.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={generateFW}
                                        className="w-max bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
                                    >
                                        <Download size={16} /> Flash C++ (.cpp) Factory Ready
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Guias do Ecrã LCD */}
                    <div className="bg-white">
                        <button
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left focus:outline-none"
                            onClick={() => toggle('hmi')}
                        >
                            <span className="font-bold flex items-center gap-2 text-slate-800">
                                <Info size={18} className="text-blue-500" /> 2. Manual Tático de Instrução (Equipa Mão de Obra)
                            </span>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'hmi' ? 'rotate-180' : ''}`} />
                        </button>
                        {openSection === 'hmi' && (
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-700 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-3"><CreditCard size={12} className="mr-1" /> Produção Lean</Badge>
                                    <h4 className="font-bold text-slate-800 mb-2">Micro-Tempos Num Barco</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">No Ecrã Base, ao Picar o Crachá num Barco puxado, inicia o tempo produtivo V.A. Tocar novamente fecha essa fatia de tempo dessa especialidade.</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mb-3"><Settings size={12} className="mr-1" /> Lógica Kanban</Badge>
                                    <h4 className="font-bold text-slate-800 mb-2">Botão Select (Puxar OP)</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">A equipa não preenche papéis. Pressionar o Select consulta a BD sobre a fila Kanban e obriga a carregar o próximo Barco ordenado na Box.</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 mb-3"><Power size={12} className="mr-1" /> NVA Tracking</Badge>
                                    <h4 className="font-bold text-slate-800 mb-2">Botão DOWN (Desperdícios)</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">Pressionar DWN entra no Módulo RH. Permite Picar Ponto Geral de Turno ou anunciar ausências "WC/Médico". A ausência morre sozinha ao voltar a picar Barco.</p>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 shadow-sm mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full shrink-0"><CheckCircle size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 mb-1">Fecho Físico Estação - Subir Barco na Cadeia</h4>
                                        <p className="text-sm text-indigo-800/80 leading-relaxed max-w-4xl">O Diretor de Linha usa o Botão "Seta para Cima" para afirmar que Barco atual completou os requisitos da Estação. O ERP desloca logicamente a "Pedra Kanban" para o próximo posto na oficina, limpando o visor de todos os colaboradores e medindo Macro OEE da Área.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
