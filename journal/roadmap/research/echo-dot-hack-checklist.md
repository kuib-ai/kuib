# Echo Dot Gen 3 (C78MP8 "Crumpet") — Hardware Hacking Checklist

## Device Info
- **Model:** C78MP8 (codename "crumpet", 2019-2020 revision)
- **SoC:** MediaTek MT8516 (quad-core ARM Cortex-A35 @ 1.3GHz)
- **RAM:** 1GB LPDDR3
- **Storage:** 1GB eMMC (Samsung KMFN60012M-B214)
- **Mics:** 4× Knowles analog MEMS → 2× TI TLV320ADC3101 ADCs
- **Speaker amp:** TI TAS2770
- **LED driver:** ISSI IS31FL3236 (I2C 0x7E)
- **WiFi/BT:** MediaTek MT7658CSN dual-band
- **UART voltage:** 1.8V (confirmed by Brian Dorey / Bruno M teardown)

## Shopping List

### Phase 1: UART Recon (~₹850)
- [ ] Digital multimeter — Sharvi Electronics, ~₹625
      (Vartech MAS830L or cheapest available)
      https://sharvielectronics.com/product/vartech-mas830l-digital-multimeter-with-probes/
- [ ] Pogo pin probes × 5 — Sharvi Electronics, ₹34 each = ₹170
      (P75-E2 spring test probe)
      https://sharvielectronics.com/product/p75-e2-spring-test-probe-pogo-pin/
- [ ] DuPont jumper wires (female-to-female) — Sharvi Electronics, ~₹30-50
      (connects pogo pins to level shifter and adapter)
- [ ] CP2102 USB-UART adapter with 1.8V support — Amazon, ~₹350-500
      (multi-voltage 1.8V/2.5V/3.3V/5V version)
      https://www.amazon.in/Adapter-Terminal-Isolator-Converter-Supported/dp/B0D2MQ5TC3
      OR: CP2102 3.3V from Sharvi (₹169) + level shifter module from Amazon

### Phase 2: eMMC Dump (additional ~₹1,500)
- [ ] eMMC USB test socket (BGA-153) — ~₹1,000-1,500
- [ ] Fine-tip soldering supplies (if not already owned)

### Phase 3: Voltage Glitching (additional ~₹5,000-10,000)
- [ ] Sipeed Tang Nano FPGA — ~₹500
- [ ] Logic analyzer (Saleae clone) — ~₹800-1,000
- [ ] N-channel MOSFET + trigger circuit components — ~₹200
- [ ] Oscilloscope (optional, helps a lot) — ₹3,000+

## Procedure

### Step 1: Validate UART voltage
1. Open Echo Dot (pry off rubber base, remove 4 screws)
2. Set multimeter to DC voltage
3. Black probe on GND pad (TM1 or TM3 on base board)
4. Red probe on UART TX pad (TM45/TM59 area on base board)
5. Power on device, read voltage
6. Expected: ~1.8V → confirms need for level shifter or multi-voltage adapter

### Step 2: Read boot log via UART
1. Connect CP2102 (at 1.8V) to Echo Dot: GND→GND, TX→RX
2. Use pogo pins to hold contact on test pads
3. Open serial terminal: `screen /dev/ttyUSB0 921600` (Linux) or equivalent
4. Power on Echo Dot
5. Capture boot log — firmware version, security state, boot timing
6. Note: console shell is DISABLED — read-only output only

### Step 3: Try fastboot via hidden USB pads
1. Locate USB test pads TM4 (D-) and TM5 (D+) on base board
2. Solder or probe connections to a USB cable
3. Hold dot button while powering on → should enter fastboot mode (green LED ring)
4. Run: `fastboot getvar all`
5. Check if bootloader reports locked/unlocked status
6. Brian Dorey confirmed this works on "donut" — test on crumpet

### Step 4: eMMC firmware dump
1. Short specific passives on eMMC data bus during boot
2. Dump full firmware image for offline analysis
3. Reverse-engineer boot chain, look for LK bootloader vulnerabilities
4. Identify partition layout, device tree, driver bindings

### Step 5: Voltage glitching (if needed)
1. Use UART boot timing from Step 2 to identify signature verification window (~700ms)
2. Identify VCore rail on PCB
3. Build glitch rig: FPGA trigger on eMMC CLK → MOSFET shorts VCore to GND
4. Sweep timing parameters (delay + pulse width)
5. NCC Group achieved ~20% success rate on MT8163 — MT8516 is same architecture family

## Key References
- Brian Dorey teardown: https://www.briandorey.com/post/echo-dot-3rd-gen-digging-deeper
- phodina echo-debug-gen3 (USB/UART pads): GitLab phodina/echo-debug-gen3
- NCC Group MT8163 glitching: https://www.nccgroup.com/research/there-s-a-hole-in-your-soc-glitching-the-mediatek-bootrom/
- Dennis Giese WiSec 2021 paper: https://www.khoury.northeastern.edu/home/noubir/publications-local/GN2021.pdf
- R0rt1z2 XDA thread (donut only): https://xdaforums.com/t/unlock-root-twrp-unbrick-amazon-echo-dot-3rd-gen-2018-donut.4801400/
- mtkclient: https://github.com/bkerler/mtkclient

## Key People
- **R0rt1z2** — TWRP device tree for crumpet, most active MTK exploit researcher
- **phodina** — documented USB/UART debug pads, got fastboot access
- **Dennis Giese** — academic paper, eMMC extraction, LK exploit portability
- **NCC Group** — proved voltage glitching on sibling SoC (MT8163)
- **Brian Dorey** — most detailed Gen 3 hardware teardown

## Store Info
- **Sharvi Electronics** (multimeter + pogo pins)
  37/1, AECS Layout – A Block, Yellama Layout, Singasandra, Bengaluru 560068
  Phone: +91 9886212536
  Hours: Mon-Fri 9AM-6PM, Sat 9AM-5PM
