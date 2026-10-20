import * as Blockly from "blockly";

type MultitaskBlock = Blockly.Block & {
  taskCount_: number;
  updateShape_: (taskCount: number) => void;
};

type MultitaskMutatorItem = Blockly.Block & {
  taskConnection_?: Blockly.Connection | null;
};

Blockly.Blocks["pybricks_multitask_mutator_container"] = {
  init() {
    this.jsonInit({
      type: "pybricks_multitask_mutator_container",
      message0: "tasks",
      args0: [],
      colour: "#9a72a2",
      nextStatement: null,
    });
    this.appendStatementInput("STACK");
  },
};

Blockly.Blocks["pybricks_multitask_mutator_item"] = {
  init() {
    this.jsonInit({
      type: "pybricks_multitask_mutator_item",
      message0: "task",
      args0: [],
      colour: "#9a72a2",
      previousStatement: null,
      nextStatement: null,
    });
  },
};

Blockly.Extensions.registerMutator(
  "multitask_mutator",
  {
    taskCount_: 1,

    saveExtraState(this: MultitaskBlock) {
      return { taskCount: this.taskCount_ };
    },

    loadExtraState(this: MultitaskBlock, state: { taskCount?: number }) {
      this.updateShape_(Math.max(1, state.taskCount ?? 1));
    },

    updateShape_(this: MultitaskBlock, taskCount: number) {
      while (
        this.getInput(`TASK${this.taskCount_ - 1}`) &&
        this.taskCount_ > taskCount
      ) {
        this.removeInput(`TASK${--this.taskCount_}`);
      }
      while (this.taskCount_ < taskCount) {
        this.appendStatementInput(`TASK${this.taskCount_}`);
        this.taskCount_ += 1;
      }
    },

    decompose(this: MultitaskBlock, workspace: Blockly.Workspace) {
      const container = workspace.newBlock(
        "pybricks_multitask_mutator_container",
      );
      (container as Blockly.BlockSvg).initSvg();
      let connection = container.getInput("STACK")?.connection;

      for (let index = 0; index < this.taskCount_; index += 1) {
        const item = workspace.newBlock("pybricks_multitask_mutator_item");
        (item as Blockly.BlockSvg).initSvg();
        if (!connection || !item.previousConnection || !item.nextConnection) {
          throw new Error("Multitask mutator blocks need stack connections.");
        }
        connection.connect(item.previousConnection);
        connection = item.nextConnection;
      }
      return container;
    },

    saveConnections(this: MultitaskBlock, container: Blockly.Block) {
      let item = container.getInputTargetBlock(
        "STACK",
      ) as MultitaskMutatorItem | null;
      let index = 0;
      while (item) {
        item.taskConnection_ = this.getInput(
          `TASK${index}`,
        )?.connection?.targetConnection;
        item =
          item.nextConnection?.targetBlock() as MultitaskMutatorItem | null;
        index += 1;
      }
    },

    compose(this: MultitaskBlock, container: Blockly.Block) {
      const connections: Array<Blockly.Connection | null | undefined> = [];
      let item = container.getInputTargetBlock(
        "STACK",
      ) as MultitaskMutatorItem | null;
      while (item) {
        if (!item.isInsertionMarker()) {
          connections.push(item.taskConnection_);
        }
        item =
          item.nextConnection?.targetBlock() as MultitaskMutatorItem | null;
      }

      this.updateShape_(Math.max(1, connections.length));
      connections.forEach((connection, index) => {
        connection?.reconnect(this, `TASK${index}`);
      });
    },
  },
  undefined,
  ["pybricks_multitask_mutator_item"],
);

Blockly.Blocks["pybricks_multitask"] = {
  init() {
    this.jsonInit({
      type: "pybricks_multitask",
      message0: "multitask until %1 done",
      args0: [
        {
          type: "field_dropdown",
          name: "MODE",
          options: [
            ["all", "all"],
            ["any", "any"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#9a72a2",
      mutator: "multitask_mutator",
    });
    (this as MultitaskBlock).taskCount_ = 0;
    (this as MultitaskBlock).updateShape_(1);
  },
};
