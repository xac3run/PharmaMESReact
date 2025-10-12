/**
 * @typedef {Object} Condition
 * @property {"qc_result"|"time_elapsed"|"equipment_signal"|"custom"} type
 * @property {string} [qcParam]
 * @property {"pass"|"fail"} [expected]
 * @property {number} [minutes]
 * @property {string} [signalCode]
 * @property {string} [formula]
 */

/**
 * @typedef {Object} Transition
 * @property {"automatic"|"manual"|"conditional"|"rework"|"parallel"} mode
 * @property {boolean} [allowManualOverride]
 * @property {Condition} [condition]
 */

/**
 * @typedef {Object} Step
 * @property {number} id
 * @property {string} name
 * @property {"process"|"weighing"|"dispensing"|"qc"|"mixing"} type
 * @property {Object} [position] - {x, y} для визуального отображения
 * @property {Transition} transition
 * @property {?number} nextStepId
 * @property {?number} reworkTargetId
 * @property {number[]} [parallelTargets]
 * @property {?number} [equipmentId]
 * @property {?number} [workStationId]
 * @property {?number} [formulaBomId]
 * @property {?Object} [qcParameters]
 * @property {?Object} [stepParameters]
 * @property {?string} [instruction]
 */

/**
 * @typedef {Object} Workflow
 * @property {number} id
 * @property {string} name
 * @property {string} version
 * @property {"draft"|"review"|"approved"} status
 * @property {?number} [formulaId]
 * @property {Step[]} steps
 * @property {?Array} [nodes]
 * @property {?Array} [edges]
 * @property {?string} [createdDate]
 */

/**
 * @typedef {Object} Formula
 * @property {number} id
 * @property {string} productName
 */

/**
 * @typedef {Object} Equipment
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} WorkStation
 * @property {number} id
 * @property {string} name
 */
