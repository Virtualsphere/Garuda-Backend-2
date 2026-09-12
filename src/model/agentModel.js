import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";

export const AGENT_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "TERMINATED"];
export const MEMBERSHIP_STATUSES = ["PAID", "PENDING", "EXEMPT"];

const Agent= sequelize.define("Agent", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    state: {
        type: DataTypes.STRING
    },
    district: {
        type: DataTypes.STRING
    },
    mandal: {
        type: DataTypes.STRING
    },
    village: {
        type: DataTypes.STRING
    },
    name: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    // Avatar used by the tactical map's identity bubbles.
    photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    refered_by: {
        type: DataTypes.INTEGER
    },

    // ── Lifecycle ──────────────────────────────────────────────────
    // All nullable with defaults so existing rows stay valid.
    alternate_phone: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.TEXT
    },
    joining_date: {
        type: DataTypes.DATEONLY
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE",
        validate: { isIn: [AGENT_STATUSES] }
    },
    membership_status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING",
        validate: { isIn: [MEMBERSHIP_STATUSES] }
    },
    membership_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    commission_earned: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    commission_paid: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    lead_source: {
        type: DataTypes.STRING
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2)
    },
    // Set when the agent was appointed from the recruitment pipeline.
    source_candidate_id: {
        type: DataTypes.INTEGER
    },

    // ── Onboarding paperwork ───────────────────────────────────────
    // Filled by the onboarding wizard. The *_uploaded flags are what the
    // desk checks against; the URLs are where the scan actually lives, and
    // may be null while a document is still on paper.
    id_proof_url: { type: DataTypes.STRING },
    id_proof_uploaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    address_proof_url: { type: DataTypes.STRING },
    address_proof_uploaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    agreement_url: { type: DataTypes.STRING },
    agreement_uploaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Refundable security deposit, distinct from the membership fee.
    security_deposit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },

    onboarded_by: { type: DataTypes.INTEGER },
    onboarding_completed_at: { type: DataTypes.DATE },

    // When the franchise deed was executed, and the receipt handed over for
    // the security deposit. Both are on the agent because they are what an
    // auditor asks for by name.
    agreement_date: { type: DataTypes.DATEONLY },
    receipt_no: { type: DataTypes.STRING },

    // A candidate whose native village had no open slot can still be
    // onboarded against other villages, with the native one held on a
    // waiting list. This records that that is what happened.
    native_village_queued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    native_village_queue_reason: { type: DataTypes.TEXT },

    // Which coordination executive looks after this agent day to day. The
    // coordination wing is sized around 500 agents per executive, so this is
    // the column that makes that quota a fact rather than a diagram.
    //
    // Distinct from `onboarded_by` (who recruited them, once) - this changes
    // whenever the agent is moved between executives.
    coordination_executive_id: { type: DataTypes.INTEGER }
    // Land counts (submitted / verified / observed) are deliberately NOT
    // stored — they are derived at read time from `land` and
    // `land_observation`, which already hold the truth.
},{
  tableName: "agent",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Agent;