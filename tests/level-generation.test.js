const assert = require("node:assert/strict");
const test = require("node:test");

function createCanvasContextMock() {
  return {
    beginPath: function () {},
    rect: function () {},
    fill: function () {},
    closePath: function () {},
    stroke: function () {},
    arc: function () {},
    fillText: function () {},
    clearRect: function () {},
    fillRect: function () {},
    strokeRect: function () {}
  };
}

function createElementMock() {
  return {
    textContent: "",
    hidden: false,
    disabled: false,
    addEventListener: function () {},
    setAttribute: function () {}
  };
}

global.window = {
  __NEON_BRICK_RALLY_TEST__: true,
  addEventListener: function () {},
  localStorage: {
    getItem: function () {
      return null;
    },
    setItem: function () {}
  }
};

global.document = {
  getElementById: function (id) {
    if (id === "gameCanvas") {
      return {
        width: 960,
        height: 640,
        addEventListener: function () {},
        getBoundingClientRect: function () {
          return { left: 0, width: 960 };
        },
        getContext: function () {
          return createCanvasContextMock();
        }
      };
    }

    return createElementMock();
  }
};

const game = require("../script.js");

function getLevelGrid(levelNumber) {
  const layoutType = game.getLayoutType(levelNumber);
  return game.createBrickGrid(layoutType, levelNumber);
}

test("every level from 1 to 50 creates visible bricks", function () {
  for (let level = 1; level <= game.maxLevel; level++) {
    const grid = getLevelGrid(level);
    const visibleCount = game.countVisibleCells(grid);

    assert.ok(visibleCount > 0, `Level ${level} should have at least one visible brick`);
  }
});

test("different layout types are selected across 50 levels", function () {
  const selectedLayouts = new Set();

  for (let level = 1; level <= game.maxLevel; level++) {
    selectedLayouts.add(game.getLayoutType(level));
  }

  assert.deepEqual([...selectedLayouts].sort(), [...game.layoutTypes].sort());
});

test("+1 life powerup is only eligible on even-numbered levels", function () {
  for (let level = 1; level <= game.maxLevel; level++) {
    const eligibleTypes = game.getEligiblePowerupTypes(level, game.maxLives - 1);
    const includesLife = eligibleTypes.includes("life");

    assert.equal(includesLife, level % 2 === 0, `Level ${level} life eligibility should match even-level rule`);
  }

  const maxLivesTypes = game.getEligiblePowerupTypes(2, game.maxLives);
  assert.equal(maxLivesTypes.includes("life"), false, "Life should not appear when lives are already maxed");
});

test("brick layouts keep bricks inside the canvas bounds", function () {
  for (let level = 1; level <= game.maxLevel; level++) {
    const grid = getLevelGrid(level);

    for (const column of grid) {
      for (const brick of column) {
        assert.ok(brick.x >= 0, `Level ${level} brick x should not be negative`);
        assert.ok(brick.y >= 0, `Level ${level} brick y should not be negative`);
        assert.ok(brick.x + brick.width <= game.canvasWidth, `Level ${level} brick should stay within canvas width`);
        assert.ok(brick.y + brick.height <= game.canvasHeight, `Level ${level} brick should stay within canvas height`);
      }
    }
  }
});

test("level difficulty values stay within reasonable limits", function () {
  let previousSpeed = 0;

  for (let level = 1; level <= game.maxLevel; level++) {
    const rowCount = game.getRowCountForLevel(level);
    const speed = game.getBallSpeedForLevel(level);
    const grid = getLevelGrid(level);

    assert.ok(rowCount >= game.baseBrickRows, `Level ${level} should not use too few rows`);
    assert.ok(rowCount <= game.maxBrickRows, `Level ${level} should not use too many rows`);
    assert.ok(speed >= 1, `Level ${level} ball speed should stay positive`);
    assert.ok(speed <= game.maxBallSpeed, `Level ${level} ball speed should stay capped`);
    assert.ok(speed >= previousSpeed, `Level ${level} ball speed should not decrease`);

    for (const column of grid) {
      for (const brick of column) {
        assert.ok(brick.hitsRemaining >= 1, `Level ${level} brick hit count should be at least 1`);
        assert.ok(brick.hitsRemaining <= 2, `Level ${level} brick hit count should be at most 2`);
      }
    }

    previousSpeed = speed;
  }
});
