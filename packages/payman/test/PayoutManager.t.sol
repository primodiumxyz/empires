// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {PayoutManager} from "src/PayoutManager.sol";
import {DeployPayoutManager} from "script/DeployPayoutManager.s.sol";

contract PayoutTest is Test {
    PayoutManager payman;
    address ADMIN;
    address ALICE = makeAddr("ALICE");
    address BOB = makeAddr("BOB");

    uint256 constant STARTING_BALANCE = 10 ether;

    function setUp() public {
        DeployPayoutManager deploy = new DeployPayoutManager();
        payman = deploy.run();

        ADMIN = payman.getPayoutAdmin();

        vm.deal(ADMIN, STARTING_BALANCE);
        vm.deal(ALICE, STARTING_BALANCE);
        vm.deal(BOB, STARTING_BALANCE);
    }

    function testRecordFailWrongCaller() public {
        address[] memory victors = new address[](1);
        victors[0] = ALICE;
        uint256[] memory balances = new uint256[](1);
        balances[0] = 100;
        vm.prank(ALICE);
        vm.expectRevert("[PAYMAN] Only authorized can manage payout system");
        payman.record(victors, balances);
    }

    function testRecordFailWinnersPayoutsLengthMismatch() public {
        address[] memory victors = new address[](2);
        victors[0] = ALICE;
        victors[1] = BOB;
        uint256[] memory balances = new uint256[](1);
        balances[0] = 100;
        vm.prank(ADMIN);
        vm.expectRevert("[PAYMAN] Winners and balances length mismatch");
        payman.record(victors, balances);
    }

    function testRecordFailPayoutExceedsValue() public {
        address[] memory victors = new address[](1);
        victors[0] = ALICE;
        uint256[] memory balances = new uint256[](1);
        balances[0] = 200;
        vm.prank(ADMIN);
        vm.expectRevert("[PAYMAN] Incorrect balances allocation");
        payman.record{value: 100}(victors, balances);
    }

    function testRecordSuccessSingleWinner() public {
        address[] memory victors = new address[](1);
        victors[0] = ALICE;
        uint256[] memory balances = new uint256[](1);
        balances[0] = 100;
        vm.prank(ADMIN);
        payman.record{value: 100}(victors, balances);
        assertEq(payman.balances(ALICE), 100);
    }

    function testRecordSuccessMultipleWinners() public {
        address[] memory victors = new address[](2);
        victors[0] = ALICE;
        victors[1] = BOB;
        uint256[] memory balances = new uint256[](2);
        balances[0] = 100;
        balances[1] = 200;
        vm.prank(ADMIN);
        payman.record{value: 300}(victors, balances);
        assertEq(payman.balances(ALICE), 100);
        assertEq(payman.balances(BOB), 200);
    }

    function testRecordSuccessMultipleRounds() public {
        address[] memory victors = new address[](2);
        victors[0] = ALICE;
        victors[1] = BOB;
        uint256[] memory balances = new uint256[](2);
        balances[0] = 100;
        balances[1] = 200;
        vm.prank(ADMIN);
        payman.record{value: 300}(victors, balances);
        assertEq(payman.balances(ALICE), 100);
        assertEq(payman.balances(BOB), 200);

        victors[0] = BOB;
        victors[1] = ALICE;
        balances[0] = 300;
        balances[1] = 400;
        vm.startPrank(ADMIN);
        payman.incrementRound();
        payman.record{value: 700}(victors, balances);
        vm.stopPrank();
        assertEq(payman.balances(ALICE), 500);
        assertEq(payman.balances(BOB), 500);
    }

    function testWithdrawFailNoPayout() public {
        vm.prank(ALICE);
        vm.expectRevert("[PAYMAN] No balances available for this address");
        payman.withdraw();
    }

    function testWithdrawSuccessSingle() public {
        address[] memory victors = new address[](1);
        victors[0] = ALICE;
        uint256[] memory balances = new uint256[](1);
        balances[0] = 100;
        vm.prank(ADMIN);
        payman.record{value: 100}(victors, balances);
        vm.prank(ALICE);
        payman.withdraw();
        assertEq(address(ALICE).balance, STARTING_BALANCE + 100);
    }

    function testWithdrawSuccessMultiple() public {
        address[] memory victors = new address[](2);
        victors[0] = ALICE;
        victors[1] = BOB;
        uint256[] memory balances = new uint256[](2);
        balances[0] = 100;
        balances[1] = 200;
        vm.prank(ADMIN);
        payman.record{value: 300}(victors, balances);
        vm.prank(ALICE);
        payman.withdraw();
        assertEq(address(ALICE).balance, STARTING_BALANCE + 100);
        vm.prank(BOB);
        payman.withdraw();
        assertEq(address(BOB).balance, STARTING_BALANCE + 200);
    }

    function testWithdrawSuccessSingleMultipleRounds() public {
        address[] memory victors = new address[](2);
        victors[0] = ALICE;
        victors[1] = BOB;
        uint256[] memory balances = new uint256[](2);
        balances[0] = 100;
        balances[1] = 200;
        vm.prank(ADMIN);
        payman.record{value: 300}(victors, balances);

        victors[0] = BOB;
        victors[1] = ALICE;
        balances[0] = 300;
        balances[1] = 400;
        vm.startPrank(ADMIN);
        payman.incrementRound();
        payman.record{value: 700}(victors, balances);
        vm.stopPrank();
        vm.prank(ALICE);
        payman.withdraw();
        assertEq(address(ALICE).balance, STARTING_BALANCE + 500);
        vm.prank(BOB);
        payman.withdraw();
        assertEq(address(BOB).balance, STARTING_BALANCE + 500);
    }

    function testGetWinnersByRound() public {
        address[] memory victors = new address[](2);
        victors[0] = ALICE;
        victors[1] = BOB;
        uint256[] memory balances = new uint256[](2);
        balances[0] = 100;
        balances[1] = 200;
        vm.prank(ADMIN);
        payman.record{value: 300}(victors, balances);

        victors[0] = BOB;
        victors[1] = ALICE;
        balances[0] = 300;
        balances[1] = 400;
        vm.startPrank(ADMIN);
        payman.incrementRound();
        payman.record{value: 700}(victors, balances);
        vm.stopPrank();

        PayoutManager.Winner[] memory winnersRound1 = payman.winnersByRound(1);
        assertEq(winnersRound1.length, 2);
        assertEq(winnersRound1[0].winner, ALICE);
        assertEq(winnersRound1[0].payout, 100);
        assertEq(winnersRound1[1].winner, BOB);
        assertEq(winnersRound1[1].payout, 200);

        PayoutManager.Winner[] memory winnersRound2 = payman.winnersByRound(2);
        assertEq(winnersRound2.length, 2);
        assertEq(winnersRound2[0].winner, BOB);
        assertEq(winnersRound2[0].payout, 300);
        assertEq(winnersRound2[1].winner, ALICE);
        assertEq(winnersRound2[1].payout, 400);
    }
}
