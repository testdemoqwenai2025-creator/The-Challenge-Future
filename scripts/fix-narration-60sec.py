#!/usr/bin/env python3
"""
Fix narration in all 7 portfolio shorts to fill full 60 seconds.
Average speech rate: ~150 words/minute = 2.5 words/second
Each scene needs: duration * 2.5 words minimum
"""

import re
import os

PORTFOLIO_DIR = "/home/z/my-project/scimspt-platform/docs/portfolio-shorts"

# Extended narration for each portfolio short - designed to fill ~60 seconds
NARRATION_CONTENTS = {
    "P12.html": [
        {"idx": 0, "scene": "0", "text": "Helios Tandem Technologies presents a compelling investment thesis in perovskite-on-silicon tandem photovoltaics. This startup addresses the fundamental efficiency limit of traditional silicon solar cells by stacking perovskite layers on top, potentially achieving over thirty percent conversion efficiency. The global solar market demands continuous efficiency improvements, and Helios Tandem's approach represents a paradigm shift in photovoltaic technology."},
        {"idx": 1, "scene": "1", "text": "This week's signal comes from Nature Energy, highlighting breakthrough stability results in perovskite tandem cells achieving over one thousand hours of operational lifetime. The research demonstrates that encapsulation techniques can now effectively protect the sensitive perovskite layer from moisture degradation, addressing the primary commercialization barrier that has held back this technology for years."},
        {"idx": 2, "scene": "2", "text": "Paper one, published in Nature Energy with over eighty citations, details the bandgap engineering optimization required for efficient tandem operation. The researchers demonstrate how tuning the perovskite composition allows optimal absorption of different solar spectrum wavelengths, complementing the underlying silicon cell's absorption profile. This spectral splitting approach is fundamental to achieving theoretical efficiency limits above forty percent."},
        {"idx": 3, "scene": "3", "text": "Paper two presents novel encapsulation methodologies using atomic layer deposited barrier films. The authors show that hermetic sealing with multi-layer structures can extend operational lifetime beyond industry requirements of twenty-five years. The scalability of these deposition techniques has been validated on six-inch wafers, demonstrating manufacturing feasibility for commercial production lines."},
        {"idx": 4, "scene": "4", "text": "Paper three examines the economic modelling of tandem module manufacturing costs. The analysis projects that despite additional processing steps, the levelized cost of electricity improves due to higher energy yield per square metre. Balance-of-system savings from smaller installation footprints further enhance the economic proposition, making tandems competitive even at modest efficiency premiums."},
        {"idx": 5, "scene": "5", "text": "Paper four investigates the compatibility of tandem architectures with existing silicon production infrastructure. The researchers successfully integrated perovskite deposition into standard PERC manufacturing lines, proving that retrofits are technically feasible. This finding significantly de-risks the capital expenditure transition for established manufacturers considering tandem adoption."},
        {"idx": 6, "scene": "6", "text": "Investment highlights include Helios Tandem's strong intellectual property position with twelve filed patents, partnerships with two tier-one solar manufacturers, and a clear pathway to pilot production within eighteen months. The team combines deep expertise from Oxford PV, MIT, and leading research institutions. Risk factors include supply chain constraints for precursor materials and competition from heterojunction alternatives. Helios Tandem — illuminating the path to terawatt-scale solar deployment."},
        {"idx": 7, "scene": "7", "text": "In conclusion, Helios Tandem represents a strategic opportunity at the intersection of materials science innovation and clean energy necessity. The convergence of academic validation, manufacturing readiness, and market demand creates favourable conditions for commercial success. We recommend close monitoring of their pilot line commissioning and customer qualification progress over the coming quarters."}
    ],
    "P3.html": [
        {"idx": 0, "scene": "0", "text": "Solid State Labs is pioneering next-generation battery technology through solid-state lithium-metal anodes paired with sulfide-based solid electrolytes. This approach promises to quintuple energy density compared to conventional lithium-ion cells while eliminating flammable liquid electrolytes entirely. The electric vehicle and consumer electronics markets represent addressable opportunities exceeding two hundred billion dollars annually."},
        {"idx": 1, "scene": "1", "text": "Our signal originates from Nature Materials, reporting a landmark achievement in sulfide electrolyte ionic conductivity exceeding that of liquid electrolytes for the first time. The argyrodite-type structure demonstrates room-temperature conductivity of over ten milliSiemens per centimeter while maintaining electrochemical stability against lithium metal, a dual requirement long considered unachievable in a single material system."},
        {"idx": 2, "scene": "2", "text": "Paper one describes the precise synthesis protocol for high-conductivity argyrodite electrolytes. The mechanical milling process parameters, annealing atmosphere control, and halide doping stoichiometry are optimized to maximize lithium-ion mobility while suppressing electronic conduction. These processing innovations enable reproducible production of electrolyte pellets with greater than ninety-nine percent theoretical density."},
        {"idx": 3, "scene": "3", "text": "Paper two addresses the critical interface stability challenge between sulfide electrolytes and oxide cathodes. The authors introduce an ultrathin interfacial coating applied via atomic layer deposition that prevents space-charge layer formation and suppresses decomposition reactions. Cells incorporating this coating retain greater than eighty percent capacity after five hundred charge-discharge cycles at room temperature."},
        {"idx": 4, "scene": "4", "text": "Revenue projections indicate Solid State Labs targets initial sales to specialty electronics manufacturers requiring enhanced safety profiles, followed by automotive qualification programs with three major OEMs. Manufacturing scale-up leverages existing roll-to-roll infrastructure with minimal retrofit requirements. Cost parity with conventional lithium-ion is projected within four years as production volumes achieve gigawatt-hour scale."},
        {"idx": 5, "scene": "5", "text": "Solid State Labs — powering the all-solid-state battery revolution with breakthrough sulfide electrolyte technology."}
    ],
    "P11.html": [
        {"idx": 0, "scene": "0", "text": "Orbital AI represents a visionary approach to sustainable data centre operations through space-based solar power transmission. By harvesting uninterrupted sunlight in geostationary orbit and beaming energy wirelessly to ground stations, Orbital AI aims to achieve ninety-plus percent capacity factors for AI training clusters. This eliminates the intermittency challenges plaguing terrestrial renewable sources."},
        {"idx": 1, "scene": "1", "text": "This week's signal from Science reports successful wireless power transmission over one hundred kilometres using rectenna arrays with demonstrated fifty percent conversion efficiency. The achievement validates the technical feasibility of space-to-ground power beaming at commercially relevant scales, overcoming previous distance limitations that constrained practical implementation."},
        {"idx": 2, "scene": "2", "text": "Paper one details the metamaterial rectenna design enabling efficient microwave-to-DC conversion across wide incident angle tolerances. The frequency-selective surface architecture maintains efficiency even as satellite orbital variations change transmission geometry. This robustness to pointing errors substantially reduces the precision requirements for space-based transmitter positioning systems."},
        {"idx": 3, "scene": "3", "text": "Paper two presents safety analysis confirming that power beam intensity remains well below international exposure standards for human occupancy within the transmission corridor. The phased array transmitter incorporates automatic shutoff mechanisms triggered by object detection, providing multiple redundant safety layers. Regulatory engagement with the FCC and ITU indicates constructive pathways toward commercial licensing approval."},
        {"idx": 4, "scene": "4", "text": "Paper three examines the levelized cost of electricity for space-based solar versus terrestrial alternatives when accounting for data centre capacity factor premiums. Despite higher capital expenditure, the avoided cost of energy storage and grid connection infrastructure makes orbital power economically competitive for continuous-load applications exceeding ten megawatts average demand."},
        {"idx": 5, "scene": "5", "text": "Paper four discusses thermal management of high-power rectenna ground stations under continuous beam reception. Active cooling systems using phase-change materials maintain diode junction temperatures within operating specifications while rejecting waste heat for secondary use in data centre pre-heating applications, improving overall system efficiency."},
        {"idx": 6, "scene": "6", "text": "Investment considerations include Orbital AI's launch manifest agreements with SpaceX, prototype ground station construction in Nevada, and letters of intent from hyperscale cloud providers seeking carbon-negative computing infrastructure. Technical risks center on launch vehicle cadence reliability and rectenna manufacturing scale-up. Orbital AI — harnessing orbital sunlight for the AI era."},
        {"idx": 7, "scene": "7", "text": "In summary, Orbital AI offers exposure to the convergent growth vectors of space commerce, artificial intelligence infrastructure, and decarbonization mandates. While the development timeline extends beyond typical venture horizons, the potential market disruption justifies patient capital commitment to this transformative approach to sustainable computing."}
    ],
    "P5.html": [
        {"idx": 0, "scene": "0", "text": "Hydrogen Forge develops high-temperature solid-oxide electrolysis cells engineered specifically for green hydrogen production at industrial scale. Unlike low-temperature PEM alternatives, solid-oxide systems leverage thermal energy to reduce electrical input requirements, potentially lowering hydrogen production costs below the Department of Energy's two-dollar-per-kilogram target."},
        {"idx": 1, "scene": "1", "text": "Signal from Nature Catalysis reports record-breaking durability of ten thousand hours continuous operation with less than one percent degradation per thousand hours. The achievement stems from a proprietary cathode microstructure resistant to chromium poisoning and delamination mechanisms that have historically limited solid-oxide stack lifetime in real-world operating conditions."},
        {"idx": 2, "scene": "2", "text": "Paper one elucidates the degradation suppression mechanism through operando synchrotron characterization. The researchers identify that controlled A-site deficiency in perovskite cathodes creates self-healing oxygen vacancy ordering that accommodates strain cycling without crack propagation. This fundamental insight enables rational design of degradation-tolerant electrode compositions."},
        {"idx": 3, "scene": "3", "text": "Paper two presents stack-level integration achievements demonstrating pressurized operation at fifteen atmospheres. Pressurized electrolysis reduces downstream compression costs for storage or pipeline injection while improving reaction kinetics through Le Chatelier's principle effects. The metallic interconnect and seal designs maintain zero detectable crossover across differential pressure transients."},
        {"idx": 4, "scene": "4", "text": "Paper three analyzes system-level economics integrating Hydrogen Forge cells with industrial waste heat sources. Steel mills, cement plants, and chemical refineries provide abundant thermal energy between five hundred and eight hundred degrees Celsius that would otherwise be discarded. Co-locating electrolyzers transforms waste heat into valuable hydrogen fuel, dramatically improving project economics."},
        {"idx": 5, "scene": "5", "text": "Paper four explores dynamic operation capabilities required for grid balancing applications. The solid-oxide architecture accommodates rapid load following between twenty and one hundred percent nominal capacity without thermal shock damage. This flexibility enables participation in ancillary service markets and renewable energy time-shifting, creating multiple revenue streams beyond hydrogen sales."},
        {"idx": 6, "scene": "6", "text": "Hydrogen Forge targets green steel and ammonia production as beachhead markets, with expansion plans for mobility fuels as hydrogen refuelling infrastructure matures. Partnerships with equipment manufacturers de-risk scale-up while the technical team brings decades of experience from national laboratory electrochemistry programs. Hydrogen Forge — forging the green hydrogen economy."}
    ],
    "P9.html": [
        {"idx": 0, "scene": "0", "text": "TMD Logic achieves wafer-scale synthesis of transition-metal dichalcogenide monolayers, enabling next-generation semiconductor devices beyond silicon scaling limits. Molybdenum disulfide and tungsten diselenide monolayers offer exceptional carrier mobility combined with atomic-scale thickness, making them ideal channel materials for sub-three-nanometer transistor nodes."},
        {"idx": 1, "scene": "1", "text": "This week's signal from Nature Electronics demonstrates uniform monolayer coverage across three-hundred-millimeter wafers with grain sizes exceeding fifty micrometers. The metal-organic chemical vapour deposition process achieves this uniformity through carefully optimized precursor pulsing sequences and substrate pretreatment protocols that were previously considered incompatible with industry-standard fabrication equipment."},
        {"idx": 2, "scene": "2", "text": "Paper one details the nucleation control mechanisms enabling large-grain growth. By suppressing random nucleation sites through surface passivation and employing seeded growth from patterned promoters, the researchers achieve near-single-crystal quality across full wafers. Grain boundary elimination is critical for device performance since boundaries act as scattering centers and leakage paths in completed transistors."},
        {"idx": 3, "scene": "3", "text": "Paper two presents electrical characterization of field-effect transistors fabricated on the synthesized material. Devices exhibit on-currents exceeding one milliampere per micrometer with subthreshold swings approaching the Boltzmann limit of sixty millivolts per decade. These metrics match or exceed reported values for mechanically exfoliated flakes from natural crystals, confirming synthesis quality."},
        {"idx": 4, "scene": "4", "text": "Revenue model focuses on epitaxial wafer sales to integrated device manufacturers and foundry partners. Initial volumes target research and development quantities with pricing reflective of premium semiconductor materials. As manufacturing yields improve, cost reductions follow the learning curve experience typical of crystal growth technologies, targeting parity with silicon-on-insulator substrates within five years."},
        {"idx": 5, "scene": "5", "text": "TMD Logic — transitioning semiconductor manufacturing from silicon to two-dimensional materials."}
    ],
    "P-cmos-2nm.html": [
        {"idx": 0, "scene": "0", "text": "Atomic Gate Systems develops gate-all-around transistor architectures essential for two-nanometer semiconductor process nodes and beyond. As planar FinFET geometries approach physical scaling limits, the vertical nanosheet structure provides superior electrostatic control over channel current, enabling continued performance scaling while reducing operating voltage for mobile applications."},
        {"idx": 1, "scene": "1", "text": "Signal from IEEE Electron Device Letters reports demonstration of gate-all-around nanosheet transistors with sheet thicknesses below five nanometers achieving record on-off current ratios exceeding ten to the seventh. The inner spacer and source-drain epitaxy integration schemes presented resolve key manufacturability concerns that had previously limited nanosheet adoption to research environments."},
        {"idx": 2, "scene": "2", "text": "Paper one describes the supercycle epitaxial growth process for silicon-germanium buffer layers that enable selective cavity formation. The precise compositional grading and etch selectivity optimization allows reliable release of suspended nanosheets without structural collapse or warpage. Process integration with standard CMOS toolsets has been validated through二百毫米 wafer demonstrations."},
        {"idx": 3, "scene": "3", "text": "Paper two addresses variability control through advanced metrology and machine-learning-assisted process adjustment. Critical dimension uniformity across the wafer meets the stringent requirements for two-nanometer node design rules, with sheet width variation below plus-or-minus three percent. Statistical process control methodologies transfer readily from existing FinFET manufacturing experience."},
        {"idx": 4, "scene": "4", "text": "Business model encompasses technology licensing to established foundries alongside co-development agreements with fabless chip designers optimizing IP blocks for gate-all-around architectures. Revenue streams include upfront licensing fees, running royalties based on wafer shipments, and premium design services for porting existing designs to the new transistor structure."},
        {"idx": 5, "scene": "5", "text": "Atomic Gate Systems — building the atomic-scale foundations for post-silicon computing."}
    ],
    "P-ai-materials.html": [
        {"idx": 0, "scene": "0", "text": "Lattice Forge delivers artificial intelligence discovered crystalline materials as a service, positioning itself as the AlphaFold equivalent for materials science. The platform screens millions of candidate crystal structures to identify novel compounds with optimized properties for battery electrodes, catalyst formulations, and semiconductor applications. Vertical integration includes computational prediction followed by experimental validation in partnered wet laboratories."},
        {"idx": 1, "scene": "1", "text": "Signal from Nature announces Google DeepMind's GNoME project discovering four point two million new stable crystal structures, representing a forty-five-fold increase over all previously known materials. Of these predictions, thirty-eight thousand compounds are flagged as synthesizable using established laboratory techniques, creating an unprecedented pipeline of candidate materials for commercial development across multiple industries."},
        {"idx": 2, "scene": "2", "text": "Paper one presents the graph neural network architecture underlying GNoME's predictive capabilities. The message-passing framework operates on periodic crystal graphs, capturing both local bonding environments and long-range structural relationships that determine thermodynamic stability. Training on the Materials Project database generalizes to accurate predictions across the full periodic table of elements."},
        {"idx": 3, "scene": "3", "text": "Paper two describes the autonomous laboratory validation pipeline that confirmed seven hundred thirty-six AI-predicted materials through robotic synthesis and characterization. The closed-loop system combines machine learning guidance with automated experiment execution, achieving confirmation rates above ninety percent for high-confidence predictions. This validation throughput exceeds conventional manual approaches by orders of magnitude."},
        {"idx": 4, "scene": "4", "text": "Lattice Forge monetizes through subscription access to screened candidate libraries, with pricing tiers based on exclusivity rights and application domains. Battery developers receive pre-validated electrode formulations with predicted voltage profiles and cycle life estimates. Catalyst researchers access surface chemistry predictions tailored to specific reaction conditions. Semiconductor teams obtain bandgap-engineered compound suggestions matching their process constraints."},
        {"idx": 5, "scene": "5", "text": "Lattice Forge — accelerating materials discovery through artificial intelligence at industrial scale."}
    ]
}


def fix_narration_in_file(filepath, filename):
    """Replace NARRATION array in HTML file with extended content."""
    print(f"\nProcessing {filename}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if filename not in NARRATION_CONTENTS:
        print(f"  ⚠️ No narration content defined for {filename}")
        return False
    
    new_narration = NARRATION_CONTENTS[filename]
    
    # Build new NARRATION JavaScript array
    narrations_parts = []
    for item in new_narration:
        # Escape single quotes in text
        text = item['text'].replace("'", "\\'")
        narrations_parts.append(f"{{idx:{item['idx']}, scene:\"{item['scene']}\", text:'{text}'}}")
    
    new_narration_str = "var NARRATION = [" + ", ".join(narrations_parts) + "];"
    
    # Find and replace existing NARRATION
    old_pattern = r'var NARRATION = \[.*?\];'
    
    if re.search(old_pattern, content, re.DOTALL):
        content = re.sub(old_pattern, new_narration_str, content, flags=re.DOTALL)
        print(f"  ✅ Updated NARRATION with {len(new_narration)} entries")
        
        # Calculate approximate word count
        total_words = sum(len(item['text'].split()) for item in new_narration)
        print(f"  📊 Total word count: ~{total_words} words (~{total_words/2.5:.0f} seconds of speech)")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    else:
        print(f"  ❌ Could not find NARRATION pattern in {filename}")
        return False


def main():
    print("=" * 60)
    print("Fixing Narration to Fill 60 Seconds in All Portfolio Shorts")
    print("=" * 60)
    
    files_to_fix = [
        "P12.html",
        "P3.html", 
        "P11.html",
        "P5.html",
        "P9.html",
        "P-cmos-2nm.html",
        "P-ai-materials.html"
    ]
    
    success_count = 0
    for filename in files_to_fix:
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        if os.path.exists(filepath):
            if fix_narration_in_file(filepath, filename):
                success_count += 1
        else:
            print(f"\n❌ File not found: {filepath}")
    
    print("\n" + "=" * 60)
    print(f"Complete! Updated {success_count}/{len(files_to_fix)} files")
    print("=" * 60)


if __name__ == "__main__":
    main()
