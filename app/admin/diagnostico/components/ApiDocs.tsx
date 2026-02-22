'use client';

import React, { useState } from 'react';
import { Download, Code2, Wifi, Settings, Info, CreditCard, ChevronDown, CheckCircle } from 'lucide-react';

export function ApiDocs({ envUrl, envAnonKey }: { envUrl: string, envAnonKey: string }) {
    const [openSection, setOpenSection] = useState<string | null>('fw');

    const toggle = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const generateFW = () => {
        const hostname = envUrl ? new URL(envUrl).hostname : 'localhost';
        const cppCode = `/* 
  ======================================================
  M.E.S. SHOPFLOOR - TERMINAL IoT (Hub NASA)
  Compilação Direcionada para NodeMCU ESP32 + RFID MFRC522
  ======================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h> // Ecrã LCD 3x3

// --- CONFIGURAÇÃO DE REDE ---
const char* ssid = "BRUNSWICK_WIFI";
const char* password = "A_TUA_PASSWORD_AQUI";

// --- API CLOUD (Gerado Automaticamente) ---
const char* api_url = "https://${hostname}/api/mes/iot";
const String auth_key = "Bearer ${envAnonKey.substring(0, 30)}... (Copiar Resto do Admin)";

// --- PINOUTS (HARDWARE) ---
#define RST_PIN    22
#define SS_PIN     21 
#define BOTAO_UP   12
#define BOTAO_DOWN 14
#define BOTAO_SEL  27

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 20, 4); 

String idEstacao = "UUID_A_DEFINIR_NO_ADMIN"; 
String currentState = "IDLE"; // IDLE, WORK, COMPLETE

void setup() {
  Serial.begin(115200);
  
  // LCD Init
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0);
  lcd.print("MES Booting...");

  // RFID Init
  SPI.begin();
  rfid.PCD_Init();

  // Botoes Init
  pinMode(BOTAO_UP, INPUT_PULLUP);
  pinMode(BOTAO_DOWN, INPUT_PULLUP);
  pinMode(BOTAO_SEL, INPUT_PULLUP);

  // WiFi Connection
  connectWiFi();
  
  lcd.clear();
  lcd.print("Aguardar Cracha...");
}

void loop() {
  // 1. Verificar Botao de FECHO MACRO (UP)
  if (digitalRead(BOTAO_UP) == LOW) {
      lcd.clear(); lcd.print("Finalizar Estacao?");
      delay(500); // Debounce
      while(digitalRead(BOTAO_SEL) == HIGH) { /* wait confirm */ }
      sendAPI("FECHAR_ESTACAO", "MAC_RFID_EQUIPA");
      delay(1000);
  }

  // 2. Procurar Cartao RFID (Picagem Ponto Ou Micro-Tarefa)
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String rfidHex = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    rfidHex += String(rfid.uid.uidByte[i], HEX);
  }
  
  lcd.clear(); lcd.print("Lendo Tag...");
  
  // Se estado Idle => Enviar GET_NEXT_OP ou PONTO
  sendAPI("TOGGLE_TAREFA", rfidHex);
  
  delay(2000); // Cooldown Leitura
}

// --- CLOUD REQUESTS ---
void sendAPI(String action, String cardHex) {
   if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      http.begin(api_url);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", auth_key);
      
      String payload = "{\\"action\\":\\""+action+"\\",\\"operador_rfid\\":\\""+cardHex+"\\",\\"estacao_id\\":\\""+idEstacao+"\\"}";
      int httpResponseCode = http.POST(payload);
      
      if(httpResponseCode > 0){
         String response = http.getString();
         lcd.clear();
         lcd.print("Sucesso! " + String(httpResponseCode));
         // Fazer Parse do JSON de reposta Nivel NASA
      } else {
         lcd.clear();
         lcd.print("Erro Rede");
      }
      http.end();
   }
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(1000); }
}
`;

        const blob = new Blob([cppCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hub_nasa_esp32_fw.cpp';
        // Append to doc for Firefox compatibility before click
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <section className="glass-panel p-6 w-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>

            <div className="relative z-10">
                <h2 className="flex items-center gap-2 mb-2 font-bold" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                    <Code2 size={22} /> Engineering & Hardware (API)
                </h2>
                <p className="text-sm opacity-70 mb-6">Laboratório de Integração IoT - Manuais e Geração de Código Root.</p>

                <div className="flex flex-col gap-3">
                    {/* Generador de C++ Otimizado */}
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                            onClick={() => toggle('fw')}
                        >
                            <span className="font-bold flex items-center gap-2 text-emerald-300">
                                <Download size={18} /> 1. Gerador de Firmware Automático (ESP32)
                            </span>
                            <ChevronDown size={18} className={`transition-transform ${openSection === 'fw' ? 'rotate-180' : ''}`} />
                        </button>
                        {openSection === 'fw' && (
                            <div className="p-4 border-t border-white/10 text-sm opacity-80 leading-relaxed bg-black/60">
                                <p className="mb-4">
                                    O código C++ foi gerado contendo automaticamente as chaves de acesso ativas, a Base HTTP (`{envUrl ? new URL(envUrl).hostname : 'Vercel App'}`) e a biblioteca `LiquidCrystal_I2C`.
                                </p>
                                <button 
                                    onClick={generateFW}
                                    className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-md transition-colors"
                                >
                                    <Download size={16} /> Fazer Download `.cpp`
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Guias do Ecrã LCD */}
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40">
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                            onClick={() => toggle('hmi')}
                        >
                            <span className="font-bold flex items-center gap-2 text-blue-300">
                                <Info size={18} /> 2. Manual Operacional do Terminal (Ecras)
                            </span>
                            <ChevronDown size={18} className={`transition-transform ${openSection === 'hmi' ? 'rotate-180' : ''}`} />
                        </button>
                        {openSection === 'hmi' && (
                            <div className="p-4 border-t border-white/10 text-sm bg-black/60 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-3"><CreditCard size={16}/> Picar o Ponto</h4>
                                    <p className="opacity-80 leading-relaxed text-xs">Aproxima o crachá no terminal principal sem carregar em qualquer botão. O visor assumirá o registo Diário de Entradas/Saídas automaticamente.</p>
                                </div>
                                <div>
                                    <h4 className="text-amber-400 font-bold flex items-center gap-2 mb-3"><Settings size={16}/> Lógica Pull-System</h4>
                                    <p className="opacity-80 leading-relaxed text-xs">O MES não permite escolhas livres. O hardware só exibe o Barco puxado ativamente pela fila Kanban na área atual de trabalho.</p>
                                </div>
                                <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                                    <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-3"><CheckCircle size={16}/> Fechar Estação</h4>
                                    <p className="opacity-80 leading-relaxed text-xs">Pressionar "Seta Cima" seguida de "Select". Avisa o Backend Next.js para fazer Forward da Ordem de Produção no Grafo do estaleiro, avançando a tarefa e limpando o Terminal.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
