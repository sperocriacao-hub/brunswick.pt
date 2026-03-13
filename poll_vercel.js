async function check() {
    console.log("Pinging Vercel API...");
    try {
        const res = await fetch('https://brunswick-pt.vercel.app/api/debug-qcis?' + Math.random());
        if (res.status === 200) {
            const json = await res.json();
            if (json.success && json.data) {
                // Check if we get lista_gate this time (the previous one did not select it)
                if (json.data[0] && json.data[0].lista_gate !== undefined) {
                    console.log("SUCCESS! Retrieved", json.count, "records.");
                    
                    let countWithDateAndGate = 0;
                    const histo = {};
                    json.data.forEach(r => {
                        const d = String(r.fail_date).substring(0, 10);
                        if (r.lista_gate) {
                            countWithDateAndGate++;
                            histo[d] = (histo[d] || 0) + 1;
                        }
                    });
                    console.log("Valid for Heatmap (has Date AND Gate):", countWithDateAndGate);
                    console.log("DATE OCCURRENCES WITH GATE:", histo);
                    return true;
                } else {
                     console.log("Waiting for new Vercel deployment (lista_gate still missing)");
                }
            }
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
    return false;
}

async function loop() {
    for(let i=0; i<30; i++) {
        const success = await check();
        if (success) return;
        await new Promise(r => setTimeout(r, 6000));
    }
    console.log("Timeout waiting for Vercel.");
}

loop();
