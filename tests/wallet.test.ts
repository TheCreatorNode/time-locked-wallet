
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { standardPrincipal } from "@stacks/transactions/dist/cl";
// import { send } from "process";
// import { constants } from "os";

const accounts = simnet.getAccounts();


describe("Testing lock", () => {
  const deployer = accounts.get('deployer')!;
  const beneficiary = accounts.get('wallet_1')!;
  const amount = 10;

  const lockResponse = simnet.callPublicFn(
    "wallet",
    'lock',
    [Cl.principal(beneficiary), Cl.uint(10), Cl.uint(amount)],
    deployer
  );

  expect(lockResponse.result).toBeOk(Cl.bool(true));

  expect(lockResponse.events).toHaveLength(1);
  expect(lockResponse.events[0].event).toBe("stx_transfer_event");

  expect(lockResponse.events[0].data).toMatchObject({
    amount: amount.toString(),
    sender: deployer,
    recipient: `${deployer}.wallet`,
  });

  it("Does not allow anyone else to lock an amount", () => {
    const accountA = accounts.get('wallet_1')!;
    const beneficiary = accounts.get('wallet_2')!;

    const lockResponse = simnet.callPublicFn(
      "wallet",
      "lock",
      [Cl.principal(beneficiary), Cl.uint(10), Cl.uint(10)],
      accountA
    );

    expect(lockResponse.result).toBeErr(Cl.uint(100));

  });

  it("Cannot lock more than once", () => {
    const deployer = accounts.get('deployer')!;
    const beneficiary = accounts.get('wallet_1')!;

    const unlockAt = 10;
    const amount = 10;

    const lockResponse1 = simnet.callPublicFn(
      "wallet",
      'lock',
      [Cl.principal(beneficiary), Cl.uint(10), Cl.uint(10)],
      deployer
    );

    const lockResponse2 = simnet.callPublicFn(
      "wallet",
      'lock',
      [Cl.principal(beneficiary), Cl.uint(10), Cl.uint(10)],
      deployer
    );

    expect(lockResponse1.result).toBeOk(Cl.bool(true));
    expect(lockResponse1.events).toHaveLength(1);
    expect(lockResponse1.events[0].event).toBe("stx_transfer_event");
    expect(lockResponse1.events[0].data).toMatchObject({
      amount: amount.toString(),
      sender: deployer,
      recipient: `${deployer}.wallet`,
    });

    expect(lockResponse2.result).toBeErr(Cl.uint(101));

    expect(lockResponse2.events).toHaveLength(0);
  });

  it("Unlock height cannot be in the past", () => {
    const deployer = accounts.get("deployer")!;
    const beneficiary = accounts.get("wallet_1")!;
    const amount = 10;
    const targetBlockHeight = 10;


    simnet.mineEmptyBlocks(targetBlockHeight + 1);

    const lockResponse = simnet.callPublicFn(
      "wallet",
      "lock",
      [Cl.principal(beneficiary), Cl.uint(targetBlockHeight), Cl.uint(amount)],
      deployer
    );
    expect(lockResponse.result).toBeErr(Cl.uint(102));
  });

});


describe("Testing bestow", () => {
it("Allow the beneficiary to bestow the right to claim to someone else",  () => {
    const deployer = accounts.get("deployer")!;
  const beneficiary = accounts.get("wallet_1")!; 
  const newBeneficiary = accounts.get("wallet_2")!;
 

  const lockResponse = simnet.callPublicFn(
    "wallet",
    "lock",
    [Cl.principal(beneficiary),Cl.uint(20), Cl.uint(10)],
    deployer
  );

  const bestowRespond = simnet.callPublicFn(
    "wallet",
    "bestow",
    [Cl.principal(newBeneficiary)],
    beneficiary
  );

  expect(lockResponse.result).toBeOk(Cl.bool(true));
  expect(bestowRespond.result).toBeOk(Cl.bool(true));
});

it("Does not allow anyone else to bestow the right to claim to someone else (not even the contract owner)", () => {
  const deployer = accounts.get("deployer")!;
  const beneficiary = accounts.get("wallet_1")!;

  const accountA = accounts.get("wallet_2")!;

  const lockResponse = simnet.callPublicFn(
    "wallet",
    "lock",
    [Cl.principal(beneficiary), Cl.uint(10), Cl.uint(10)],
    deployer
  )
  const bestowRespond1 = simnet.callPublicFn(
    "wallet",
    "bestow",
    [Cl.principal(accountA)],
    deployer
  )

  const bestowRespond2 = simnet.callPublicFn(
    "wallet",
    "bestow",
    [Cl.principal(beneficiary)],
    accountA
  )

  expect(bestowRespond1.result ).toBeErr(Cl.uint(104));
   expect(bestowRespond2.result ).toBeErr(Cl.uint(104));
});

});

describe("Testing claim", () => {
  it("Allows the beneficiary to claim the balnace when the block-height is reached", () => {
    const deployer = accounts.get("deployer")!;
    const beneficiary = accounts.get("wallet_1")!;
    const targetBlockHeight = 10;
    const amount = 10;

      const lockResponse = simnet.callPublicFn(
    "wallet",
    "lock",
    [Cl.principal(beneficiary), Cl.uint(10), Cl.uint(10)],
    deployer
  );

  simnet.mineEmptyBlocks(targetBlockHeight);

  const claimResponse = simnet.callPublicFn(
    "wallet",
    "claim",
    [], 
    beneficiary
  );

  expect(claimResponse.result).toBeOk(Cl.bool(true));
  expect(claimResponse.events[0].data).toMatchObject({
    amount: amount.toString(),
    sender: `${deployer}.wallet`,
    recipient: beneficiary,
  });
  });
  
});


