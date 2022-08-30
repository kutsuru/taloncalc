import { Component, OnInit } from '@angular/core';
import { ConnectableObservable } from 'rxjs';
import { TTCoreService } from '../../core/tt-core.service';

@Component({
  selector: 'select-battle-target',
  templateUrl: './select-battle-target.component.html',
  styleUrls: ['./select-battle-target.component.css'],
})
export class SelectBattleTargetComponent implements OnInit {
  protected mobKeys: string[] = [];
  protected selectedMob: string = 'Poring';
  protected selectedMobId: number = 1002;

  protected isMvPFilter: boolean = true;
  protected isBossClassFilter: boolean = true;
  protected isNormalClassFilter: boolean = true;

  protected raceFilter: string = 'all';
  protected sizeFilter: string = 'all';
  protected classFilter: string = 'all';
  protected regionFilter: string = 'all';
  protected elementFilter: string = 'all';

  protected sizes: string[] = ['all', 'small', 'medium', 'large'];
  protected elements: string[] = [
    'all',
    'neutral',
    'water',
    'earth',
    'fire',
    'wind',
    'poison',
    'holy',
    'shadow',
    'ghost',
    'undead',
  ];
  protected races: string[] = [
    'all',
    'formless',
    'undead',
    'brute',
    'plant',
    'insect',
    'fish',
    'demon',
    'demiHuman',
    'angel',
    'dragon',
  ];
  protected regions: string[] = [
    'all',
    'SQI Instances',
    'GMC',
    'Abyss Lake Dungeon',
    'Amatsu',
    'Ancient Tower',
    'Ant Hell',
    'Ayothaya',
    'Battlegrounds',
    'Bibilan',
    'Bio Labs',
    'Bitfrost',
    'Brasilis',
    'Clock Tower',
    'Coal Mine',
    'Comodo Caves',
    'Comodo Fields',
    'Culverts',
    'Dewata',
    'Dimensional Crack',
    'Eclage',
    'Einbroch Dungeon',
    'Einbroch Fields',
    'Elysian Garden',
    'El Dicastes',
    'Endless Tower Finale',
    'Geffenia',
    'Geffen Dungeon',
    'Geffen Fields',
    'Glast Heim',
    'Glast Heim Dungeons',
    'Gonryun',
    'Guild Dungeon [Aldebaran]',
    'Guild Dungeon [Arunafeltz]',
    'Guild Dungeon [Geffen]',
    'Guild Dungeon [Morroc]',
    'Guild Dungeon [Payon]',
    'Guild Dungeon [Prontera]',
    'Guild Dungeon [Schwartzvald]',
    'Hidden Temple',
    'Hugel Fields',
    'Ice Cave',
    'Juperos Dungeon',
    'Kiel Dungeon',
    'Lighthalzen Fields',
    'Louyang',
    'Lutie & Toy Factory',
    'Magma Dungeon',
    'Malangdo',
    'Malangdo Culvert',
    'Manuk',
    'Morroc Fields',
    'Moscovia',
    'Mt. Mjolnir',
    'Nameless Island',
    "Nidhoggr's Nest",
    'Niflheim',
    'Odins Shrine',
    'Old Glast Heim',
    'Orc Dungeon',
    'Payon Dungeon',
    'Payon Fields',
    'Poring Island',
    'Port Malaya Instance',
    'Prontera Fields',
    'Pyramid',
    'Pyramid [Nightmare]',
    'Rachel Fields',
    'Rachel Sanctuary',
    'Scaraba Hole',
    'Sphinx',
    'Splendide',
    'Seals(Old)',
    'Sunken Ship',
    'Thanatos Tower',
    'Thors Volcano',
    'Turtle Island',
    'Umbala Dungeon',
    'Umbala Fields',
    "Valkyries' Realm",
    'Veins Fields',
    'War of Emperium',
    'Yuno Fields',
  ];

  constructor(protected ttCore: TTCoreService) {
    this.applyFilter();
  }

  ngOnInit() {}

  applyFilter() {
    this.mobKeys = [];
    for (let key in this.ttCore.mobDb) {
      let filter: boolean = true;
      let currentMob = this.ttCore.mobDb[key];

      filter &&=
        'all' === this.sizeFilter || currentMob['size'] === this.sizeFilter;
      filter &&=
        'all' === this.raceFilter || currentMob['race'] === this.raceFilter;
      filter &&=
        'all' === this.regionFilter ||
        currentMob['region'].includes(this.regionFilter);
      filter &&=
        'all' === this.elementFilter ||
        currentMob['element'] === this.elementFilter;

      filter &&=
        (this.isMvPFilter && currentMob['mode']['isMvP']) ||
        (this.isBossClassFilter && currentMob['mode']['isBoss']) ||
        (this.isNormalClassFilter && !currentMob['mode']['isBoss']);

      //filter &&= (currentMob['race2'] === "all" || currentMob['region'] === this.regionFilter);

      if (filter) this.mobKeys.push(key);
    }

    if (this.mobKeys.length) {
      this.selectedMob = this.mobKeys[0];
      this.selectedMobId = this.ttCore.mobDb[this.selectedMob]['mid'];
    }
    this.mobKeys.sort((a, b) => (a > b ? 1 : -1));
  }

  onMobSelection() {
    this.selectedMobId = this.ttCore.mobDb[this.selectedMob]['mid'];
  }
}
