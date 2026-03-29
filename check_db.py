import urllib.request
import json

URL = "https://efenntgldjizgyyttiiw.supabase.co/rest/v1/operadores?select=nome_operador,data_nascimento,data_admissao,status"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZW5udGdsZGppemd5eXR0aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzI5ODIsImV4cCI6MjA4NzI0ODk4Mn0.1KPq3FBSo5Nn3qNQoHMEMvPBKBa1SYeI72QaUZMXSMc"

req = urllib.request.Request(URL)
req.add_header('apikey', KEY)
req.add_header('Authorization', f'Bearer {KEY}')

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
        print(f"Total Operadores: {len(data)}")
        ativos = [o for o in data if not o.get('status') or (o.get('status') or '').lower() == 'ativo']
        print(f"Ativos: {len(ativos)}")
        
        from datetime import datetime
        mes_atual = datetime.now().month
        print(f"Mes Atual Analisado: {mes_atual}")
        
        print("\n=== RAW MATCHES PARA '03' OU 'MARCO' ===")
        for op in ativos:
            nasc = str(op.get('data_nascimento') or '')
            adm = str(op.get('data_admissao') or '')
            
            if '03' in nasc or '03' in adm or 'março' in nasc.lower() or 'março' in adm.lower():
                print(f"{op.get('nome_operador')}: nasc [{nasc}], adm [{adm}], status [{op.get('status')}]")
                
        def parse_date_parts(date_str):
            if not date_str: return None
            try:
                clean_str = date_str.split('T')[0] if 'T' in date_str else date_str.split(' ')[0]
                p = clean_str.split('/') if '/' in clean_str else clean_str.split('-')
                if len(p) < 3: return None
                
                if len(p[0]) == 4:
                    y, m, d = p[0], p[1], p[2]
                else:
                    d, m, y = p[0], p[1], p[2]
                    
                pY = int(y[:4])
                pM = int(m)
                pD = int(d)
                return {'year': pY, 'month': pM, 'day': pD}
            except Exception as e:
                return str(e)

        print("\n=== PARSE RESULTS FOR MARCH ===")
        for op in ativos:
            nP = parse_date_parts(op.get('data_nascimento'))
            aP = parse_date_parts(op.get('data_admissao'))
            
            if (isinstance(nP, dict) and nP.get('month') == mes_atual) or (isinstance(aP, dict) and aP.get('month') == mes_atual):
                print(f"[MATCH!] {op.get('nome_operador')} -> Nasc: {nP}, Adm: {aP}")

except Exception as e:
    print("Error:", e)
