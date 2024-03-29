export enum MetadataFlags {
  INDEX = 0,
  HEALTH = 1, //int (minecart/boat)
  VARIANT = 2, //int
  COLOR = 3,
  COLOUR = 3, //byte
  NAMETAG = 4, //string
  OWNER_EID = 5, //long
  TARGET_EID = 6, //long
  AIR = 7, //short
  POTION_COLOR = 8, //int (ARGB!)
  POTION_AMBIENT = 9, //byte
  JUMP_DURATION = 10, //long
  HURT_TIME = 11, //int (minecart/boat)
  HURT_DIRECTION = 12, //int (minecart/boat)
  PADDLE_TIME_LEFT = 13, //float
  PADDLE_TIME_RIGHT = 14, //float
  EXPERIENCE_VALUE = 15, //int (xp orb)
  MINECART_DISPLAY_BLOCK = 16, //int (id | (data << 16))
  MINECART_DISPLAY_OFFSET = 17, //int
  MINECART_HAS_DISPLAY = 18, //byte (must be 1 for minecart to show block inside)
  OLD_SWELL = 20,
  SWELL_DIR = 21,
  CHARGE_AMOUNT = 22,
  ENDERMAN_HELD_RUNTIME_ID = 23, //short
  ENTITY_AGE = 24, //short
  PLAYER_FLAGS = 26,
  PLAYER_INDEX = 27,
  PLAYER_BED_POSITION = 28, //block coords
  FIREBALL_POWER_X = 29, //float
  FIREBALL_POWER_Y = 30,
  FIREBALL_POWER_Z = 31,
  AUX_POWER = 32,
  FISH_X = 33,
  FISH_Z = 34,
  FISH_ANGLE = 35,
  POTION_AUX_VALUE = 36, //short
  LEAD_HOLDER_EID = 37, //long
  SCALE = 38,
  INTERACTIVE_TAG = 39, //string
  NPC_SKIN_ID = 40, //string
  URL_TAG = 41, //string
  MAX_AIRDATA_MAX_AIR = 42, //short
  MARK_VARIANT = 43, //int
  CONTAINER_TYPE = 44, //byte
  CONTAINER_BASE_SIZE = 45, //int
  CONTAINER_EXTRA_SLOTS_PER_STRENGTH = 46, //int
  BLOCK_TARGET = 47,
  WITHER_INVULNERABLE_TICKS = 48, //int
  WITHER_TARGET_1 = 49, //long
  WITHER_TARGET_2 = 50, //long
  WITHER_TARGET_3 = 51, //long
  AERIAL_ATTACK = 52,
  BOUNDINGBOX_WIDTH = 53,
  BOUNDINGBOX_HEIGHT = 54,
  FUSE_LENGTH = 55,
  RIDER_SEAT_POSITION = 56, //vector3f
  RIDER_ROTATION_LOCKED = 57, //byte
  RIDER_MAX_ROTATION = 58, //float
  RIDER_MIN_ROTATION = 59, //float
  AREA_EFFECT_CLOUD_RADIUS = 60, //float
  AREA_EFFECT_CLOUD_WAITING = 61, //int
  AREA_EFFECT_CLOUD_PARTICLE_ID = 62, //int
  SHULKER_PEEK_ID = 63, //int
  SHULKER_ATTACH_FACE = 64, //byte
  SHULKER_ATTACHED = 65, //short
  SHULKER_ATTACH_POS = 66,
  TRADING_PLAYER_EID = 67, //long
  TRADING_CAREER = 68,
  HAS_COMMAND_BLOCK = 69,
  COMMAND_BLOCK_COMMAND = 70, //string
  COMMAND_BLOCK_LAST_OUTPUT = 71, //string
  COMMAND_BLOCK_TRACK_OUTPUT = 72, //byte
  CONTROLLING_RIDER_SEAT_NUMBER = 73, //byte
  STRENGTH = 74, //int
  MAX_STRENGTH = 75, //int
  SPELL_CASTING_COLOR = 76, //int
  LIMITED_LIFE = 77,
  ARMOR_STAND_POSE_INDEX = 78, // int
  ENDER_CRYSTAL_TIME_OFFSET = 79, // int
  ALWAYS_SHOW_NAMETAG = 80, // byte
  COLOR_2 = 81, // byte
  NAME_AUTHOR = 82,
  SCORE_TAG = 83, //String
  BALLOON_ATTACHED_ENTITY = 84, // long
  PUFFERFISH_SIZE = 85,
  BUBBLE_TIME = 86,
  AGENT = 87,
  SITTING_AMOUNT = 88,
  SITTING_AMOUNT_PREVIOUS = 89,
  EATING_COUNTER = 90,
  FLAGS_EXTENDED = 91,
  LAYING_AMOUNT = 92,
  LAYING_AMOUNT_PREVIOUS = 93,
  DURATION = 94,
  SPAWN_TIME = 95,
  CHANGE_RATE = 96,
  CHANGE_ON_PICKUP = 97,
  PICKUP_COUNT = 98,
  INTERACT_TEXT = 99,
  TRADE_TIER = 100,
  MAX_TRADE_TIER = 101,
  TRADE_EXPERIENCE = 102,
  SKIN_ID = 103,
  SPAWNING_FRAMES = 104,
  COMMAND_BLOCK_TICK_DELAY = 105,
  COMMAND_BLOCK_EXECUTE_ON_FIRST_TICK = 106,
  AMBIENT_SOUND_INTERVAL = 107,
  AMBIENT_SOUND_INTERVAL_RANGE = 108,
  AMBIENT_SOUND_EVENT_NAME = 109,
  FALL_DAMAGE_MULTIPLIER = 110,
  NAME_RAW_TEXT = 111,
  CAN_RIDE_TARGET = 112,
  LOW_TIER_CURED_DISCOUNT = 113,
  HIGH_TIER_CURED_DISCOUNT = 114,
  NEARBY_CURED_DISCOUNT = 115,
  NEARBY_CURED_DISCOUNT_TIMESTAMP = 116,
  HITBOX = 117,
  IS_BUOYANT = 118,
  BUOYANCY_DATA = 119,
}
