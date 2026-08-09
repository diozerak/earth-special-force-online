// Внешность ботов: базовый шаблон (Bot_01 — настроен в редакторе) + рандомизация

export const BOT_LOOK_BASE: any = {
  "colors": {
    "hair": "#fbbf24",
    "aura": "#3b82f6",
    "kameha": "#3b82f6",
    "trail": "#22d3ee",
    "skin": "#f2c49b",
    "headBack": "#f2c49b",
    "cloth": "#1e293b"
  },
  "hairLen": 1,
  "fingers": 3,
  "kamehaHands": "right",
  "beamSide": "right",
  "gap": 12,
  "twoPalms": true,
  "eyes": {
    "count": 2,
    "z": 36,
    "style": "angry",
    "mid": {
      "x": -12.5,
      "y": 3.5,
      "rot": -105
    },
    "scale": 0.6,
    "color": "#817e7e"
  },
  "parts": {
    "legL": {
      "on": true,
      "type": "stub",
      "x": 7,
      "y": -20,
      "rot": -105,
      "z": 0,
      "scale": 0.7
    },
    "legR": {
      "on": true,
      "type": "stub",
      "x": 1,
      "y": -7.5,
      "rot": -65,
      "z": 0,
      "scale": 0.7
    },
    "booTail": {
      "on": false,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 33,
      "scale": 1
    },
    "earL": {
      "on": false,
      "type": "human",
      "color": "",
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 29,
      "scale": 1
    },
    "earR": {
      "on": false,
      "type": "human",
      "color": "",
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 29,
      "scale": 1
    },
    "torso": {
      "on": true,
      "type": "rect",
      "x": 0,
      "y": 0.5,
      "rot": -45,
      "z": 1,
      "scale": 0.45
    },
    "armL": {
      "on": true,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 8
    },
    "armR": {
      "on": true,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 8
    },
    "handL": {
      "on": true,
      "type": "fist",
      "x": 0,
      "y": 0,
      "rot": 0,
      "frot": 0,
      "z": 15
    },
    "handR": {
      "on": true,
      "type": "fist",
      "x": 0,
      "y": 0,
      "rot": 0,
      "frot": 0,
      "z": 15
    },
    "shoulderL": {
      "on": true,
      "type": "plate",
      "x": 0,
      "y": 5,
      "rot": 30,
      "z": 7
    },
    "shoulderR": {
      "on": true,
      "type": "plate",
      "x": 0,
      "y": -2.5,
      "rot": -150,
      "z": 6
    },
    "chest": {
      "on": false,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 28
    },
    "head": {
      "on": true,
      "x": -7,
      "y": 2.5,
      "rot": 0,
      "z": 30,
      "scale": 0.65
    },
    "hairFront": {
      "on": true,
      "x": -15.5,
      "y": 2.5,
      "rot": -10,
      "z": 32,
      "scale": 0.55
    },
    "hairMid": {
      "on": false,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 32,
      "scale": 1
    },
    "hairLong": {
      "on": false,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 32,
      "scale": 1
    },
    "fingerL1": {
      "on": true,
      "x": 4,
      "y": 0.5,
      "rot": 15,
      "scale": 1
    },
    "fingerL2": {
      "on": true,
      "x": -5.5,
      "y": -5.5,
      "rot": -5,
      "scale": 1
    },
    "fingerL3": {
      "on": true,
      "x": -15.5,
      "y": -10.5,
      "rot": -50,
      "scale": 1
    },
    "fingerR1": {
      "on": true,
      "x": -0.5,
      "y": 1.5,
      "rot": 0,
      "scale": 1
    },
    "fingerR2": {
      "on": true,
      "x": 0,
      "y": -2,
      "rot": 0,
      "scale": 1
    },
    "fingerR3": {
      "on": true,
      "x": -1,
      "y": -4.5,
      "rot": 0,
      "scale": 1
    },
    "antennaL": {
      "on": false,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 33,
      "scale": 1
    },
    "antennaR": {
      "on": false,
      "x": 0,
      "y": 0,
      "rot": 0,
      "z": 33,
      "scale": 1
    }
  },
  "states": {
    "MELEE": {
      "handR": {
        "type": "fist",
        "rot": 50,
        "frot": -60,
        "scale": 0.55,
        "x": -4.5,
        "y": -4
      },
      "armL": {
        "on": true,
        "x": -12,
        "y": -20,
        "rot": -60,
        "z": 13,
        "scale": 1
      },
      "armR": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": -10,
        "z": 4,
        "scale": 0.8
      },
      "handL": {
        "on": true,
        "type": "fist",
        "x": 1.5,
        "y": 0.5,
        "rot": -140,
        "frot": 0,
        "z": 15,
        "scale": 0.55
      },
      "eyes": {
        "color": "#ff0000",
        "scale": 0.45,
        "mid": {
          "x": -2.5,
          "y": 3.5,
          "rot": -90
        },
        "style": "line"
      },
      "head": {
        "on": true,
        "x": -0.5,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "hairFront": {
        "on": true,
        "x": -0.5,
        "y": 2.5,
        "rot": 170,
        "z": 32,
        "scale": 0.7
      },
      "fingerL1": {
        "on": true,
        "x": -4.5,
        "y": 0,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -5.5,
        "y": 0.5,
        "rot": -45,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 0.5,
        "y": 0,
        "rot": -50,
        "scale": 1
      }
    },
    "MELEE_CHARGE": {
      "handL": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": -1,
        "rot": 55,
        "frot": 0,
        "z": 15,
        "scale": 0.5
      },
      "handR": {
        "type": "fist",
        "rot": 55,
        "frot": 0,
        "scale": 0.5,
        "y": 1
      },
      "armL": {
        "on": true,
        "x": 3.5,
        "y": 0,
        "rot": 0,
        "z": 8
      },
      "armR": {
        "on": true,
        "x": 3.5,
        "y": 0,
        "rot": 0,
        "z": 8
      },
      "eyes": {
        "color": "#d77070",
        "mid": {
          "x": -1,
          "y": 3.5,
          "rot": -105
        }
      },
      "hairFront": {
        "on": true,
        "x": -6.5,
        "y": 2.5,
        "rot": -10,
        "z": 37,
        "scale": 0.55
      },
      "head": {
        "on": true,
        "x": 1,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "fingerL1": {
        "on": true,
        "x": -0.5,
        "y": 0,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -0.5,
        "y": 0.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": -0.5,
        "y": -4,
        "rot": -50,
        "scale": 1
      }
    },
    "KI_CHARGE": {
      "handL": {
        "type": "cup",
        "rot": -85,
        "frot": -50,
        "scale": 0.35,
        "x": 15,
        "z": 7
      },
      "handR": {
        "type": "cup",
        "rot": 90,
        "frot": -45,
        "x": 13.5,
        "scale": 0.4,
        "z": 6,
        "y": 4.5
      },
      "armL": {
        "on": true,
        "x": 13.5,
        "y": 0.5,
        "rot": -20,
        "z": 5
      },
      "armR": {
        "on": true,
        "x": 13,
        "y": 2.5,
        "rot": 10,
        "z": 6
      },
      "hairFront": {
        "on": true,
        "x": -8.5,
        "y": 2.5,
        "rot": 180,
        "z": 32,
        "scale": 0.65
      },
      "eyes": {
        "color": "#447ef3"
      }
    },
    "KI_BLAST": {
      "handR": {
        "on": true,
        "type": "cup",
        "x": 0,
        "y": 0,
        "rot": 80,
        "frot": -60,
        "z": 15,
        "scale": 0.55
      },
      "armL": {
        "on": true,
        "x": -22,
        "y": 13,
        "rot": 0,
        "z": 8
      },
      "handL": {
        "on": true,
        "type": "cup",
        "x": 2,
        "y": 3.5,
        "rot": -105,
        "frot": 130,
        "z": 6,
        "scale": 0.55
      },
      "fingerL1": {
        "on": true,
        "x": 4,
        "y": -0.5,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -5.5,
        "y": 5.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": -15.5,
        "y": 10.5,
        "rot": -50,
        "scale": 1
      },
      "armR": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 6
      },
      "fingerR1": {
        "on": true,
        "x": 4,
        "y": 0.5,
        "rot": 15,
        "scale": 1
      },
      "fingerR2": {
        "on": true,
        "x": -5.5,
        "y": -5.5,
        "rot": -5,
        "scale": 1
      },
      "fingerR3": {
        "on": true,
        "x": -15.5,
        "y": -10.5,
        "rot": -50,
        "scale": 1
      },
      "beamSide": "right",
      "eyes": {
        "mid": {
          "x": -7.5,
          "y": 3.5,
          "rot": -105
        }
      }
    },
    "KI_BEAM_CHARGE": {
      "handR": {
        "on": true,
        "type": "cup",
        "x": 0,
        "y": 0,
        "rot": 75,
        "frot": -60,
        "z": 15,
        "scale": 0.55
      },
      "armL": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 8
      },
      "handL": {
        "on": true,
        "type": "cup",
        "x": 0.5,
        "y": 2.5,
        "rot": -120,
        "frot": 120,
        "z": 7,
        "scale": 0.55
      },
      "fingerL1": {
        "on": true,
        "x": 4,
        "y": -0.5,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -5.5,
        "y": 5.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": -15.5,
        "y": 10.5,
        "rot": -50,
        "scale": 1
      },
      "armR": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 4
      },
      "fingerR1": {
        "on": true,
        "x": 4,
        "y": 0.5,
        "rot": 15,
        "scale": 1
      },
      "fingerR2": {
        "on": true,
        "x": -5.5,
        "y": -5.5,
        "rot": -5,
        "scale": 1
      },
      "fingerR3": {
        "on": true,
        "x": -15.5,
        "y": -10.5,
        "rot": -50,
        "scale": 1
      },
      "eyes": {
        "mid": {
          "x": -7.5,
          "y": 3.5,
          "rot": -105
        }
      }
    },
    "KAMEHAMEHA_CHARGE": {
      "kamehaHands": "right",
      "handR": {
        "type": "cup",
        "rot": 50,
        "frot": -55
      },
      "handL": {
        "type": "cup",
        "rot": 5,
        "frot": 55
      },
      "twoPalms": true,
      "eyes": {
        "mid": {
          "x": -8.5,
          "y": 3.5,
          "rot": -105
        },
        "color": "#0044b3"
      },
      "hairFront": {
        "on": true,
        "x": -8,
        "y": 2.5,
        "rot": -180,
        "z": 32,
        "scale": 0.65
      }
    },
    "SUPER_ATTACK": {
      "twoPalms": true,
      "gap": 12,
      "handL": {
        "type": "cup",
        "rot": -90,
        "frot": -45,
        "scale": 0.75,
        "x": -3,
        "y": 1
      },
      "handR": {
        "type": "cup",
        "rot": 90,
        "frot": -45,
        "scale": 0.75,
        "x": -3,
        "y": -1.5
      },
      "eyes": {
        "mid": {
          "x": -7.5,
          "y": 3.5,
          "rot": -105
        }
      },
      "armL": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 7
      },
      "armR": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 6
      }
    },
    "SWORD": {
      "handR": {
        "on": true,
        "type": "open",
        "x": -1,
        "y": -3.5,
        "rot": 35,
        "frot": 0,
        "z": 15,
        "scale": 0.6
      },
      "chest": {
        "on": false,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 28,
        "scale": 1
      },
      "eyes": {
        "mid": {
          "x": -8,
          "y": 3.5,
          "rot": -100
        },
        "style": "glow",
        "color": "#2853a0",
        "scale": 0.55
      },
      "twoPalms": true,
      "armL": {
        "on": true,
        "x": -2,
        "y": 0,
        "rot": 10,
        "z": 6
      },
      "armR": {
        "on": true,
        "x": -2,
        "y": 0,
        "rot": -10,
        "z": 6
      },
      "handL": {
        "on": true,
        "type": "open",
        "x": 2,
        "y": 2,
        "rot": 30,
        "frot": 0,
        "z": 15,
        "scale": 0.6
      },
      "fingerL1": {
        "on": true,
        "x": -1,
        "y": -0.5,
        "rot": -20,
        "scale": 1.2
      },
      "fingerL2": {
        "on": true,
        "x": -2,
        "y": 0.5,
        "rot": -5,
        "scale": 1.3
      },
      "fingerL3": {
        "on": true,
        "x": 0,
        "y": -4,
        "rot": 100,
        "scale": 1
      },
      "fingerR1": {
        "on": true,
        "x": -1.5,
        "y": -1,
        "rot": -30,
        "scale": 1.2
      },
      "fingerR2": {
        "on": true,
        "x": 0,
        "y": -1,
        "rot": -60,
        "scale": 1.3
      },
      "fingerR3": {
        "on": true,
        "x": -2.5,
        "y": -2.5,
        "rot": -130,
        "scale": 1
      }
    },
    "SLASH": {
      "handL": {
        "type": "cup",
        "rot": -120,
        "frot": 125,
        "x": -8.5,
        "scale": 0.55,
        "y": 5,
        "z": 6
      },
      "head": {
        "on": true,
        "x": -0.5,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "eyes": {
        "mid": {
          "x": -0.5,
          "y": 3.5,
          "rot": -105
        }
      },
      "hairFront": {
        "on": true,
        "x": -8,
        "y": 2.5,
        "rot": -10,
        "z": 32,
        "scale": 0.55
      },
      "armL": {
        "on": true,
        "x": -6.5,
        "y": 6,
        "rot": 65,
        "z": 6
      },
      "fingerL1": {
        "on": true,
        "x": -4,
        "y": 6,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -0.5,
        "y": 1,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 0,
        "y": -7,
        "rot": -50,
        "scale": 1
      },
      "handR": {
        "type": "cup",
        "scale": 0.55,
        "rot": 45,
        "frot": 115,
        "x": 17.5,
        "y": -10.5,
        "z": 10
      },
      "armR": {
        "on": true,
        "x": -11,
        "y": 0,
        "rot": 0,
        "z": 0
      }
    },
    "IDLE": {
      "armL": {
        "on": true,
        "x": 4,
        "y": 4,
        "rot": -95,
        "z": 6
      },
      "armR": {
        "on": true,
        "x": 5.5,
        "y": 1,
        "rot": 0,
        "z": 5
      },
      "handL": {
        "on": true,
        "type": "fist",
        "x": 4.5,
        "y": 0,
        "rot": 75,
        "frot": 0,
        "z": 5,
        "scale": 0.55
      },
      "handR": {
        "on": true,
        "type": "fist",
        "x": 5,
        "y": 2.5,
        "rot": -40,
        "frot": 0,
        "z": 4,
        "scale": 0.55
      },
      "eyes": {
        "mid": {
          "x": -7.5,
          "y": 3.5,
          "rot": -105
        }
      },
      "fingerL3": {
        "on": true,
        "x": -1,
        "y": 0,
        "rot": -50,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -5,
        "y": -1,
        "rot": -5,
        "scale": 1
      },
      "fingerL1": {
        "on": true,
        "x": -5,
        "y": 2,
        "rot": 15,
        "scale": 1
      }
    },
    "HIT": {
      "handR": {
        "on": true,
        "type": "fist",
        "x": -2,
        "y": 3,
        "rot": 0,
        "frot": 0,
        "z": 5,
        "scale": 0.45
      },
      "handL": {
        "on": true,
        "type": "fist",
        "x": 3.5,
        "y": 3.5,
        "rot": 110,
        "frot": 0,
        "z": 5,
        "scale": 0.55
      },
      "armL": {
        "on": true,
        "x": 2.5,
        "y": 6.5,
        "rot": -85,
        "z": 7
      },
      "armR": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 6
      },
      "hairFront": {
        "on": true,
        "x": -15.5,
        "y": 2.5,
        "rot": -40,
        "z": 32,
        "scale": 0.55
      },
      "eyes": {
        "mid": {
          "x": -12.5,
          "y": 2,
          "rot": -85
        }
      },
      "fingerL1": {
        "on": true,
        "x": -4,
        "y": -0.5,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -5,
        "y": 0,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 0,
        "y": 1,
        "rot": -50,
        "scale": 1
      }
    },
    "WALK": {
      "handL": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": 0,
        "rot": -180,
        "frot": 145,
        "z": 15,
        "scale": 0.6
      },
      "handR": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": 0,
        "rot": 15,
        "frot": 0,
        "z": 15,
        "scale": 0.7
      },
      "fingerL1": {
        "on": true,
        "x": -5,
        "y": 3,
        "rot": 15,
        "scale": 1
      },
      "eyes": {
        "mid": {
          "x": 4,
          "y": 3.5,
          "rot": -105
        }
      },
      "head": {
        "on": true,
        "x": 3.5,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "hairFront": {
        "on": true,
        "x": -5,
        "y": 2.5,
        "rot": -10,
        "z": 32,
        "scale": 0.55
      },
      "fingerL2": {
        "on": true,
        "x": -4,
        "y": -3.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 2,
        "y": -5,
        "rot": -50,
        "scale": 1
      }
    },
    "DASH": {
      "handL": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": 0,
        "rot": -180,
        "frot": 145,
        "z": 15,
        "scale": 0.6
      },
      "handR": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": 0,
        "rot": 15,
        "frot": 0,
        "z": 15,
        "scale": 0.7
      },
      "fingerL1": {
        "on": true,
        "x": -5,
        "y": 3,
        "rot": 15,
        "scale": 1
      },
      "eyes": {
        "mid": {
          "x": 4,
          "y": 3.5,
          "rot": -105
        }
      },
      "head": {
        "on": true,
        "x": 3.5,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "hairFront": {
        "on": true,
        "x": -5,
        "y": 2.5,
        "rot": -10,
        "z": 32,
        "scale": 0.55
      },
      "fingerL2": {
        "on": true,
        "x": -4,
        "y": -3.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 2,
        "y": -5,
        "rot": -50,
        "scale": 1
      }
    },
    "SWOOP": {
      "handL": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": 0,
        "rot": -180,
        "frot": 145,
        "z": 15,
        "scale": 0.6
      },
      "handR": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": 0,
        "rot": 15,
        "frot": 0,
        "z": 15,
        "scale": 0.7
      },
      "fingerL1": {
        "on": true,
        "x": -5,
        "y": 3,
        "rot": 15,
        "scale": 1
      },
      "eyes": {
        "mid": {
          "x": 4,
          "y": 3.5,
          "rot": -105
        }
      },
      "head": {
        "on": true,
        "x": 3.5,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "hairFront": {
        "on": true,
        "x": -5,
        "y": 2.5,
        "rot": -10,
        "z": 32,
        "scale": 0.55
      },
      "fingerL2": {
        "on": true,
        "x": -4,
        "y": -3.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 2,
        "y": -5,
        "rot": -50,
        "scale": 1
      }
    },
    "KNOCKBACK": {
      "handR": {
        "on": true,
        "type": "fist",
        "x": -2,
        "y": 3,
        "rot": 0,
        "frot": 0,
        "z": 5,
        "scale": 0.45
      },
      "handL": {
        "on": true,
        "type": "fist",
        "x": 3.5,
        "y": 3.5,
        "rot": 110,
        "frot": 0,
        "z": 5,
        "scale": 0.55
      },
      "armL": {
        "on": true,
        "x": 2.5,
        "y": 6.5,
        "rot": -85,
        "z": 7
      },
      "armR": {
        "on": true,
        "x": 0,
        "y": 0,
        "rot": 0,
        "z": 6
      },
      "hairFront": {
        "on": true,
        "x": -15.5,
        "y": 2.5,
        "rot": -40,
        "z": 32,
        "scale": 0.55
      },
      "eyes": {
        "mid": {
          "x": -12.5,
          "y": 2,
          "rot": -85
        }
      },
      "fingerL1": {
        "on": true,
        "x": -4,
        "y": -0.5,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -5,
        "y": 0,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": 0,
        "y": 1,
        "rot": -50,
        "scale": 1
      }
    },
    "TELEPORT": {
      "handL": {
        "on": true,
        "type": "fist",
        "x": 0,
        "y": -1,
        "rot": 55,
        "frot": 0,
        "z": 15,
        "scale": 0.5
      },
      "handR": {
        "type": "fist",
        "rot": 55,
        "frot": 0,
        "scale": 0.5,
        "y": 1
      },
      "armL": {
        "on": true,
        "x": 3.5,
        "y": 0,
        "rot": 0,
        "z": 8
      },
      "armR": {
        "on": true,
        "x": 3.5,
        "y": 0,
        "rot": 0,
        "z": 8
      },
      "eyes": {
        "color": "#d77070",
        "mid": {
          "x": -1,
          "y": 3.5,
          "rot": -105
        }
      },
      "hairFront": {
        "on": true,
        "x": -6.5,
        "y": 2.5,
        "rot": -10,
        "z": 37,
        "scale": 0.55
      },
      "head": {
        "on": true,
        "x": 1,
        "y": 2.5,
        "rot": 0,
        "z": 30,
        "scale": 0.65
      },
      "fingerL1": {
        "on": true,
        "x": -0.5,
        "y": 0,
        "rot": 15,
        "scale": 1
      },
      "fingerL2": {
        "on": true,
        "x": -0.5,
        "y": 0.5,
        "rot": -5,
        "scale": 1
      },
      "fingerL3": {
        "on": true,
        "x": -0.5,
        "y": -4,
        "rot": -50,
        "scale": 1
      }
    }
  }
};

function hsl(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return "#" + to(f(0)) + to(f(8)) + to(f(4));
}

const SKINS = ["#f2c49b", "#e8b48a", "#d99e6f", "#c98a5a", "#f6d0b0", "#a9744f", "#8a5a3b"];
const CLOTHS = ["#1e293b", "#334155", "#0f172a", "#3b2f2f", "#1a3a2a", "#3a1a1a", "#2a1a3a", "#40342a"];
const EYE_STYLES = ["rect", "circle", "angry", "line", "glow"];
const TORSO_TYPES = ["ellipse", "rect", "slim"];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Полная внешность бота: шаблон + случайные цвета, глаза (только 2 симметричных),
// волосы (лысый или короткие), тип торса
export function randomizeLook(): any {
  const look = JSON.parse(JSON.stringify(BOT_LOOK_BASE));
  const skin = pick(SKINS);
  look.colors.skin = skin;
  look.colors.headBack = skin;
  look.colors.cloth = pick(CLOTHS);
  look.colors.hair = hsl(rnd(0, 360), rnd(55, 85), rnd(40, 65));
  look.colors.aura = hsl(rnd(0, 360), 80, 60);
  look.colors.kameha = hsl(rnd(0, 360), 85, 55);
  look.colors.trail = hsl(rnd(0, 360), 80, 60);
  look.eyes.count = 2; // только симметричная пара
  look.eyes.style = pick(EYE_STYLES);
  const bald = Math.random() < 0.5;
  look.hairLen = bald ? 0 : 1;
  look.parts.hairFront.on = !bald;
  look.parts.hairMid.on = false;
  look.parts.hairLong.on = false;
  look.parts.torso.type = pick(TORSO_TYPES);
  return look;
}
